"""Kiosk Router - Self-Servis Kiosk"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/kiosk", tags=["Kiosk"])

class KioskProduct(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image: Optional[str] = None
    category: Optional[str] = None
    available: bool = True

class KioskOrder(BaseModel):
    items: List[dict]
    total: float
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None

@router.get("/products")
async def get_kiosk_products():
    db = get_db()
    if db is None:
        return []
    products = await db.kiosk_products.find({"available": True}, {"_id": 0}).to_list(100)
    return products

@router.post("/products")
async def create_kiosk_product(product: KioskProduct, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    product_doc = {
        "id": str(uuid.uuid4()),
        **product.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kiosk_products.insert_one(product_doc)
    product_doc.pop("_id", None)
    return product_doc

@router.put("/products/{product_id}")
async def update_kiosk_product(product_id: str, product: KioskProduct, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_products.update_one({"id": product_id}, {"$set": product.model_dump()})
    updated = await db.kiosk_products.find_one({"id": product_id}, {"_id": 0})
    return updated

@router.delete("/products/{product_id}")
async def delete_kiosk_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_products.delete_one({"id": product_id})
    return {"status": "deleted"}

@router.post("/orders")
async def create_kiosk_order(order: KioskOrder):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order_count = await db.kiosk_orders.count_documents({})
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": f"K-{str(order_count + 1).zfill(6)}",
        **order.model_dump(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kiosk_orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return order_doc

@router.get("/orders")
async def get_kiosk_orders(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return []
    
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.kiosk_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@router.put("/orders/{order_id}/status")
async def update_kiosk_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}
