"""Orders Router - Bayi Siparişleri"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user, get_current_dealer
from utils.database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float

class OrderCreate(BaseModel):
    items: List[OrderItem]
    notes: Optional[str] = None
    shipping_address: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    order_number: str
    dealer_id: Optional[str] = None
    dealer_name: Optional[str] = None
    items: List[dict]
    total: float
    status: str
    notes: Optional[str] = None
    created_at: str

@router.post("", response_model=OrderResponse)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    total = sum(item.quantity * item.unit_price for item in order.items)
    order_count = await db.orders.count_documents({})
    
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": f"ORD-{str(order_count + 1).zfill(6)}",
        "items": [item.model_dump() for item in order.items],
        "total": total,
        "status": "pending",
        "notes": order.notes,
        "shipping_address": order.shipping_address,
        "created_by": current_user.get("email"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return OrderResponse(**order_doc)

@router.get("", response_model=List[OrderResponse])
async def get_orders(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [OrderResponse(**o) for o in orders]

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return OrderResponse(**order)

@router.put("/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}

@router.delete("/{order_id}")
async def delete_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return {"status": "deleted"}

# Bayi Siparişleri
@router.post("/dealer", response_model=OrderResponse)
async def create_dealer_order(order: OrderCreate, current_dealer: dict = Depends(get_current_dealer)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    dealer = await db.dealers.find_one(
        {"$or": [{"id": current_dealer.get("user_id")}, {"code": current_dealer.get("email")}]},
        {"_id": 0}
    )
    
    total = sum(item.quantity * item.unit_price for item in order.items)
    order_count = await db.orders.count_documents({})
    
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": f"ORD-{str(order_count + 1).zfill(6)}",
        "dealer_id": dealer.get("id") if dealer else current_dealer.get("user_id"),
        "dealer_name": dealer.get("name") if dealer else current_dealer.get("email"),
        "items": [item.model_dump() for item in order.items],
        "total": total,
        "status": "pending",
        "notes": order.notes,
        "shipping_address": order.shipping_address or (dealer.get("address") if dealer else None),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return OrderResponse(**order_doc)

@router.get("/dealer/my-orders", response_model=List[OrderResponse])
async def get_dealer_orders(current_dealer: dict = Depends(get_current_dealer)):
    db = get_db()
    if not db:
        return []
    
    dealer = await db.dealers.find_one(
        {"$or": [{"id": current_dealer.get("user_id")}, {"code": current_dealer.get("email")}]},
        {"_id": 0}
    )
    
    dealer_id = dealer.get("id") if dealer else current_dealer.get("user_id")
    orders = await db.orders.find({"dealer_id": dealer_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [OrderResponse(**o) for o in orders]
