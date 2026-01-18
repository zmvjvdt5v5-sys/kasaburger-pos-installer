"""Invoices Router - Fatura Yönetimi"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/invoices", tags=["Invoices"])


class InvoiceItem(BaseModel):
    product_id: str
    product_name: str
    quantity: float
    unit_price: float
    total: float

class InvoiceCreate(BaseModel):
    dealer_id: str
    dealer_name: str
    items: List[InvoiceItem]
    subtotal: float
    tax_amount: float
    total: float
    due_date: Optional[str] = None
    notes: Optional[str] = ""

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    dealer_id: str
    dealer_name: str
    items: List[dict]
    subtotal: float
    tax_amount: float
    total: float
    paid_amount: Optional[float] = 0
    status: str = "unpaid"
    due_date: Optional[str] = None
    notes: Optional[str] = ""
    created_at: Optional[str] = None
    paid_at: Optional[str] = None


async def generate_invoice_number(db):
    """Benzersiz fatura numarası üret"""
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    count = await db.invoices.count_documents({"invoice_number": {"$regex": f"^FTR-{today}"}})
    return f"FTR-{today}-{count + 1:04d}"


@router.post("", response_model=InvoiceResponse)
async def create_invoice(invoice: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    """Yeni fatura oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    invoice_id = str(uuid.uuid4())
    invoice_number = await generate_invoice_number(db)
    
    invoice_doc = {
        "id": invoice_id,
        "invoice_number": invoice_number,
        **invoice.model_dump(),
        "paid_amount": 0,
        "status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "paid_at": None
    }
    await db.invoices.insert_one(invoice_doc)
    
    # Bayi bakiyesini güncelle
    await db.dealers.update_one(
        {"id": invoice.dealer_id},
        {"$inc": {"balance": invoice.total, "current_balance": invoice.total}}
    )
    
    invoice_doc.pop("_id", None)
    return InvoiceResponse(**invoice_doc)


@router.get("")
async def get_invoices(current_user: dict = Depends(get_current_user)):
    """Tüm faturaları getir"""
    db = get_db()
    if db is None:
        return []
    
    invoices = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return invoices


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """Belirli bir faturayı getir"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    return invoice


@router.put("/{invoice_id}/pay")
async def pay_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """Faturayı ödenmiş olarak işaretle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": {
            "status": "paid",
            "paid_amount": invoice["total"],
            "paid_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Bayi bakiyesini güncelle
    await db.dealers.update_one(
        {"id": invoice["dealer_id"]},
        {"$inc": {"balance": -invoice["total"], "current_balance": -invoice["total"]}}
    )
    
    # Gelir kaydı oluştur
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "type": "income",
        "category": "Satış",
        "amount": invoice["total"],
        "description": f"Fatura ödemesi: {invoice['invoice_number']}",
        "reference_id": invoice_id,
        "reference_type": "invoice",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Fatura ödendi"}


@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """Fatura sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    # Ödenmemişse bakiyeyi düzelt
    if invoice.get("status") == "unpaid":
        await db.dealers.update_one(
            {"id": invoice["dealer_id"]},
            {"$inc": {"balance": -invoice["total"], "current_balance": -invoice["total"]}}
        )
    
    await db.invoices.delete_one({"id": invoice_id})
    return {"message": "Fatura silindi"}
