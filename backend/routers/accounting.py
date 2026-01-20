"""Accounting Router - Muhasebe Modülü"""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/accounting", tags=["Accounting"])

class TransactionCreate(BaseModel):
    type: str  # income, expense
    category: str
    amount: float
    description: Optional[str] = None
    date: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    type: str
    category: str
    amount: float
    description: Optional[str] = None
    date: str
    created_at: str

@router.get("/summary")
async def get_accounting_summary(current_user: dict = Depends(get_current_user)):
    """Muhasebe özeti"""
    db = get_db()
    if db is None:
        return {"total_income": 0, "total_expense": 0, "net_profit": 0}
    
    # Bu ayın başlangıcı
    today = datetime.now(timezone.utc)
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # Gelirler (siparişlerden)
    kiosk_orders = await db.kiosk_orders.find({"created_at": {"$gte": month_start}}, {"_id": 0, "total": 1}).to_list(1000)
    pos_orders = await db.pos_orders.find({"created_at": {"$gte": month_start}}, {"_id": 0, "total": 1}).to_list(1000)
    
    total_income = sum(o.get("total", 0) for o in kiosk_orders) + sum(o.get("total", 0) for o in pos_orders)
    
    # Giderler
    expenses = await db.transactions.find({"type": "expense", "created_at": {"$gte": month_start}}, {"_id": 0}).to_list(500)
    total_expense = sum(e.get("amount", 0) for e in expenses)
    
    # Manuel gelirler
    incomes = await db.transactions.find({"type": "income", "created_at": {"$gte": month_start}}, {"_id": 0}).to_list(500)
    total_income += sum(i.get("amount", 0) for i in incomes)
    
    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_profit": total_income - total_expense,
        "month": today.strftime("%Y-%m")
    }

@router.get("/transactions")
async def get_transactions(
    type: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """İşlem listesi"""
    db = get_db()
    if db is None:
        return []
    
    query = {}
    if type:
        query["type"] = type
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return transactions

@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate, current_user: dict = Depends(get_current_user)):
    """Yeni işlem ekle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    now = datetime.now(timezone.utc).isoformat()
    
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "type": transaction.type,
        "category": transaction.category,
        "amount": transaction.amount,
        "description": transaction.description or "",
        "date": transaction.date or now[:10],
        "created_at": now,
        "created_by": current_user.get("email")
    }
    
    await db.transactions.insert_one(transaction_doc)
    transaction_doc.pop("_id", None)
    return TransactionResponse(**transaction_doc)

@router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    """İşlem sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="İşlem bulunamadı")
    
    return {"status": "deleted"}

@router.get("/categories")
async def get_categories(current_user: dict = Depends(get_current_user)):
    """Kategori listesi"""
    return {
        "income": ["Satış", "Bayi Ödemesi", "Diğer Gelir"],
        "expense": ["Hammadde", "Personel", "Kira", "Fatura", "Pazarlama", "Bakım", "Diğer Gider"]
    }
