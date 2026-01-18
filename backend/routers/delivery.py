"""Delivery Router - Paket Servis Entegrasyonları"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user, get_current_dealer
from utils.database import get_db

router = APIRouter(prefix="/delivery", tags=["Delivery"])

class DeliveryPlatformConfig(BaseModel):
    platform: str  # yemeksepeti, getir, trendyol, migros
    enabled: bool = False
    api_key: Optional[str] = None
    restaurant_id: Optional[str] = None
    webhook_secret: Optional[str] = None

class DeliveryOrder(BaseModel):
    platform: str
    external_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: str
    items: List[dict]
    total: float
    delivery_fee: Optional[float] = 0
    notes: Optional[str] = None

# Platform Yapılandırmaları
@router.get("/platforms")
async def get_delivery_platforms(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return []
    configs = await db.delivery_platforms.find({}, {"_id": 0}).to_list(10)
    return configs

@router.post("/platforms")
async def save_delivery_platform(config: DeliveryPlatformConfig, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.delivery_platforms.update_one(
        {"platform": config.platform},
        {"$set": {**config.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"status": "saved"}

# Siparişler
@router.get("/orders")
async def get_delivery_orders(platform: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return []
    
    query = {}
    if platform:
        query["platform"] = platform
    if status:
        query["status"] = status
    
    orders = await db.delivery_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@router.post("/orders")
async def create_delivery_order(order: DeliveryOrder, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order_count = await db.delivery_orders.count_documents({})
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": f"D-{str(order_count + 1).zfill(6)}",
        **order.model_dump(),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.delivery_orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return order_doc

@router.put("/orders/{order_id}/status")
async def update_delivery_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.delivery_orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}

# Webhooks
@router.post("/webhook/yemeksepeti")
async def yemeksepeti_webhook(request: Request):
    db = get_db()
    if db is None:
        return {"status": "ok"}
    
    try:
        data = await request.json()
        # Sipariş işleme
        if data.get("type") == "order.created":
            order_data = data.get("order", {})
            order_doc = {
                "id": str(uuid.uuid4()),
                "platform": "yemeksepeti",
                "external_id": order_data.get("id"),
                "customer_name": order_data.get("customer", {}).get("name"),
                "customer_phone": order_data.get("customer", {}).get("phone"),
                "customer_address": order_data.get("delivery", {}).get("address"),
                "items": order_data.get("items", []),
                "total": order_data.get("total", 0),
                "status": "new",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.delivery_orders.insert_one(order_doc)
    except:
        pass
    
    return {"status": "ok"}

@router.post("/webhook/getir")
async def getir_webhook(request: Request):
    db = get_db()
    if db is None:
        return {"status": "ok"}
    
    try:
        data = await request.json()
        if data.get("event") == "order_created":
            order = data.get("payload", {})
            order_doc = {
                "id": str(uuid.uuid4()),
                "platform": "getir",
                "external_id": order.get("id"),
                "customer_name": order.get("client", {}).get("name"),
                "customer_address": order.get("client", {}).get("deliveryAddress"),
                "items": order.get("products", []),
                "total": order.get("totalPrice", 0),
                "status": "new",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.delivery_orders.insert_one(order_doc)
    except:
        pass
    
    return {"status": "ok"}

@router.post("/webhook/trendyol")
async def trendyol_webhook(request: Request):
    return {"status": "ok"}

@router.post("/webhook/migros")
async def migros_webhook(request: Request):
    return {"status": "ok"}
