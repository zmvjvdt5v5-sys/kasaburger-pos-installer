"""Payments Router - Ödeme Modülü"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentCreate(BaseModel):
    dealer_id: Optional[str] = None
    invoice_id: Optional[str] = None
    amount: float
    payment_method: str  # cash, bank_transfer, credit_card, check
    description: Optional[str] = None
    payment_date: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    dealer_id: Optional[str] = None
    dealer_name: Optional[str] = None
    invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    amount: float
    payment_method: str
    description: Optional[str] = None
    payment_date: str
    status: str
    created_at: str

@router.get("")
async def get_payments(
    dealer_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Ödeme listesi"""
    db = get_db()
    if db is None:
        return []
    
    query = {}
    if dealer_id:
        query["dealer_id"] = dealer_id
    if status:
        query["status"] = status
    
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    # Bayi ve fatura bilgilerini ekle
    for payment in payments:
        if payment.get("dealer_id"):
            dealer = await db.dealers.find_one({"id": payment["dealer_id"]}, {"_id": 0, "name": 1})
            payment["dealer_name"] = dealer.get("name") if dealer else "-"
        if payment.get("invoice_id"):
            invoice = await db.invoices.find_one({"id": payment["invoice_id"]}, {"_id": 0, "invoice_number": 1})
            payment["invoice_number"] = invoice.get("invoice_number") if invoice else "-"
    
    return payments

@router.post("", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate, current_user: dict = Depends(get_current_user)):
    """Yeni ödeme ekle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Bayi adını al
    dealer_name = None
    if payment.dealer_id:
        dealer = await db.dealers.find_one({"id": payment.dealer_id}, {"_id": 0, "name": 1})
        dealer_name = dealer.get("name") if dealer else None
        
        # Bayi bakiyesini güncelle
        await db.dealers.update_one(
            {"id": payment.dealer_id},
            {"$inc": {"balance": -payment.amount, "current_balance": -payment.amount}}
        )
    
    # Fatura numarasını al
    invoice_number = None
    if payment.invoice_id:
        invoice = await db.invoices.find_one({"id": payment.invoice_id}, {"_id": 0, "invoice_number": 1})
        invoice_number = invoice.get("invoice_number") if invoice else None
        
        # Fatura durumunu güncelle
        await db.invoices.update_one(
            {"id": payment.invoice_id},
            {"$set": {"status": "paid", "paid_at": now}}
        )
    
    payment_doc = {
        "id": str(uuid.uuid4()),
        "dealer_id": payment.dealer_id,
        "dealer_name": dealer_name,
        "invoice_id": payment.invoice_id,
        "invoice_number": invoice_number,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "description": payment.description or "",
        "payment_date": payment.payment_date or now[:10],
        "status": "completed",
        "created_at": now,
        "created_by": current_user.get("email")
    }
    
    await db.payments.insert_one(payment_doc)
    payment_doc.pop("_id", None)
    return PaymentResponse(**payment_doc)

@router.get("/summary")
async def get_payments_summary(current_user: dict = Depends(get_current_user)):
    """Ödeme özeti"""
    db = get_db()
    if db is None:
        return {"total": 0, "this_month": 0, "pending": 0}
    
    today = datetime.now(timezone.utc)
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    all_payments = await db.payments.find({"status": "completed"}, {"_id": 0, "amount": 1, "created_at": 1}).to_list(1000)
    
    total = sum(p.get("amount", 0) for p in all_payments)
    this_month = sum(p.get("amount", 0) for p in all_payments if p.get("created_at", "") >= month_start)
    
    # Bekleyen faturalar
    pending_invoices = await db.invoices.find({"status": {"$in": ["pending", "sent"]}}, {"_id": 0, "total": 1}).to_list(500)
    pending = sum(i.get("total", 0) for i in pending_invoices)
    
    return {
        "total": total,
        "this_month": this_month,
        "pending": pending,
        "count": len(all_payments)
    }

@router.get("/methods")
async def get_payment_methods(current_user: dict = Depends(get_current_user)):
    """Ödeme yöntemleri"""
    return [
        {"id": "cash", "name": "Nakit"},
        {"id": "bank_transfer", "name": "Banka Transferi"},
        {"id": "credit_card", "name": "Kredi Kartı"},
        {"id": "check", "name": "Çek"}
    ]
