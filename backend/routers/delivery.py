"""Delivery Router - Paket Servis Entegrasyonları"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
import logging

from utils.auth import get_current_user, get_current_dealer
from utils.database import get_db

router = APIRouter(prefix="/delivery", tags=["Delivery"])
logger = logging.getLogger(__name__)

class DeliveryPlatformConfig(BaseModel):
    platform: str  # yemeksepeti, getir, trendyol, migros
    enabled: bool = False
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    restaurant_id: Optional[str] = None
    supplier_id: Optional[str] = None
    store_id: Optional[str] = None
    webhook_secret: Optional[str] = None
    auto_accept: bool = False
    default_prep_time: int = 30

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
    payment_method: Optional[str] = "online"  # online, cash

# Platform Yapılandırmaları
@router.get("/platforms")
async def get_delivery_platforms(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return []
    configs = await db.delivery_platforms.find({}, {"_id": 0, "api_secret": 0, "webhook_secret": 0}).to_list(10)
    return configs

@router.get("/platforms/{platform}")
async def get_platform_config(platform: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return {"platform": platform, "enabled": False}
    config = await db.delivery_platforms.find_one({"platform": platform}, {"_id": 0})
    if config:
        config.pop("api_secret", None)
        config.pop("webhook_secret", None)
    return config or {"platform": platform, "enabled": False}

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
    return {"status": "saved", "message": f"{config.platform} ayarları kaydedildi"}

@router.post("/platforms/{platform}/test")
async def test_platform_connection(platform: str, current_user: dict = Depends(get_current_user)):
    """Platform bağlantısını test et"""
    db = get_db()
    if db is None:
        return {"success": False, "error": "Veritabanı bağlantısı yok"}
    
    config = await db.delivery_platforms.find_one({"platform": platform}, {"_id": 0})
    if not config or not config.get("enabled"):
        return {"success": False, "error": f"{platform} entegrasyonu aktif değil"}
    
    if not config.get("api_key"):
        return {"success": False, "error": "API anahtarı tanımlı değil"}
    
    try:
        from services.delivery_clients import get_platform_client
        client = get_platform_client(platform, config)
        orders = await client.get_orders()
        return {
            "success": True,
            "message": f"{platform} bağlantısı başarılı",
            "order_count": len(orders) if orders else 0
        }
    except Exception as e:
        logger.error(f"Platform test error: {e}")
        return {"success": False, "error": str(e)}

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

@router.get("/orders/live")
async def get_live_orders(current_user: dict = Depends(get_current_user)):
    """Tüm platformlardan canlı siparişleri getir"""
    db = get_db()
    if db is None:
        return []
    
    # Aktif siparişler (new, accepted, preparing, ready)
    orders = await db.delivery_orders.find(
        {"status": {"$in": ["new", "accepted", "preparing", "ready"]}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    
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

@router.put("/orders/{order_id}/accept")
async def accept_delivery_order(order_id: str, prep_time: int = 30, current_user: dict = Depends(get_current_user)):
    """Siparişi kabul et"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.delivery_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # Platform API'sine bildir
    platform = order.get("platform")
    if platform:
        config = await db.delivery_platforms.find_one({"platform": platform}, {"_id": 0})
        if config and config.get("enabled") and config.get("api_key"):
            try:
                from services.delivery_clients import get_platform_client
                client = get_platform_client(platform, config)
                external_id = order.get("external_id")
                if external_id:
                    await client.accept_order(external_id, prep_time)
            except Exception as e:
                logger.error(f"Platform accept error: {e}")
    
    await db.delivery_orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "accepted",
            "accepted_at": datetime.now(timezone.utc).isoformat(),
            "prep_time": prep_time
        }}
    )
    return {"status": "accepted", "prep_time": prep_time}

@router.put("/orders/{order_id}/reject")
async def reject_delivery_order(order_id: str, reason: str = "Yoğunluk", current_user: dict = Depends(get_current_user)):
    """Siparişi reddet"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.delivery_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # Platform API'sine bildir
    platform = order.get("platform")
    if platform:
        config = await db.delivery_platforms.find_one({"platform": platform}, {"_id": 0})
        if config and config.get("enabled") and config.get("api_key"):
            try:
                from services.delivery_clients import get_platform_client
                client = get_platform_client(platform, config)
                external_id = order.get("external_id")
                if external_id:
                    await client.reject_order(external_id, reason)
            except Exception as e:
                logger.error(f"Platform reject error: {e}")
    
    await db.delivery_orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "rejected",
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "reject_reason": reason
        }}
    )
    return {"status": "rejected", "reason": reason}

@router.put("/orders/{order_id}/status")
async def update_delivery_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.delivery_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # Platform API'sine bildir
    platform = order.get("platform")
    if platform and status in ["preparing", "ready", "delivered"]:
        config = await db.delivery_platforms.find_one({"platform": platform}, {"_id": 0})
        if config and config.get("enabled") and config.get("api_key"):
            try:
                from services.delivery_clients import get_platform_client
                client = get_platform_client(platform, config)
                external_id = order.get("external_id")
                if external_id:
                    if hasattr(client, f"mark_{status}"):
                        await getattr(client, f"mark_{status}")(external_id)
                    elif hasattr(client, "update_status"):
                        await client.update_status(external_id, status)
            except Exception as e:
                logger.error(f"Platform status error: {e}")
    
    await db.delivery_orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "updated"}

# Webhooks - Platform bildirimlerini al
async def process_webhook_order(db, platform: str, order_data: dict):
    """Webhook'tan gelen siparişi işle"""
    order_count = await db.delivery_orders.count_documents({})
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": f"D-{str(order_count + 1).zfill(6)}",
        "platform": platform,
        "external_id": order_data.get("id") or order_data.get("orderId"),
        "customer_name": order_data.get("customer", {}).get("name") or order_data.get("client", {}).get("name", "Müşteri"),
        "customer_phone": order_data.get("customer", {}).get("phone") or order_data.get("client", {}).get("phone"),
        "customer_address": order_data.get("delivery", {}).get("address") or order_data.get("client", {}).get("deliveryAddress", ""),
        "items": order_data.get("items") or order_data.get("products", []),
        "total": order_data.get("total") or order_data.get("totalPrice", 0),
        "delivery_fee": order_data.get("deliveryFee", 0),
        "payment_method": order_data.get("paymentMethod", "online"),
        "notes": order_data.get("note") or order_data.get("notes", ""),
        "status": "new",
        "raw_data": order_data,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.delivery_orders.insert_one(order_doc)
    return order_doc

@router.post("/webhook/yemeksepeti")
async def yemeksepeti_webhook(request: Request, background_tasks: BackgroundTasks):
    db = get_db()
    if db is None:
        return {"status": "ok"}
    
    try:
        data = await request.json()
        event_type = data.get("type") or data.get("eventType")
        
        if event_type in ["order.created", "ORDER_CREATED", "new_order"]:
            order_data = data.get("order") or data.get("data", {})
            await process_webhook_order(db, "yemeksepeti", order_data)
            logger.info(f"Yemeksepeti order received: {order_data.get('id')}")
        
        elif event_type in ["order.cancelled", "ORDER_CANCELLED"]:
            external_id = data.get("orderId") or data.get("order", {}).get("id")
            if external_id:
                await db.delivery_orders.update_one(
                    {"platform": "yemeksepeti", "external_id": external_id},
                    {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
                )
    except Exception as e:
        logger.error(f"Yemeksepeti webhook error: {e}")
    
    return {"status": "ok"}

@router.post("/webhook/getir")
async def getir_webhook(request: Request, background_tasks: BackgroundTasks):
    db = get_db()
    if db is None:
        return {"status": "ok"}
    
    try:
        data = await request.json()
        event = data.get("event") or data.get("type")
        
        if event in ["order_created", "ORDER_CREATED"]:
            order_data = data.get("payload") or data.get("order", {})
            await process_webhook_order(db, "getir", order_data)
            logger.info(f"Getir order received: {order_data.get('id')}")
        
        elif event in ["order_cancelled", "ORDER_CANCELLED"]:
            external_id = data.get("payload", {}).get("id") or data.get("orderId")
            if external_id:
                await db.delivery_orders.update_one(
                    {"platform": "getir", "external_id": external_id},
                    {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
                )
    except Exception as e:
        logger.error(f"Getir webhook error: {e}")
    
    return {"status": "ok"}

@router.post("/webhook/trendyol")
async def trendyol_webhook(request: Request, background_tasks: BackgroundTasks):
    db = get_db()
    if db is None:
        return {"status": "ok"}
    
    try:
        data = await request.json()
        
        if data.get("status") == "Created" or data.get("type") == "order_created":
            await process_webhook_order(db, "trendyol", data)
            logger.info(f"Trendyol order received: {data.get('id')}")
    except Exception as e:
        logger.error(f"Trendyol webhook error: {e}")
    
    return {"status": "ok"}

@router.post("/webhook/migros")
async def migros_webhook(request: Request, background_tasks: BackgroundTasks):
    db = get_db()
    if db is None:
        return {"status": "ok"}
    
    try:
        data = await request.json()
        event_type = data.get("eventType") or data.get("type")
        
        if event_type in ["ORDER_CREATED", "new_order"]:
            order_data = data.get("order") or data
            await process_webhook_order(db, "migros", order_data)
            logger.info(f"Migros order received: {order_data.get('id')}")
    except Exception as e:
        logger.error(f"Migros webhook error: {e}")
    
    return {"status": "ok"}

# Raporlar
@router.get("/reports/summary")
async def get_delivery_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        return {"total_orders": 0, "total_revenue": 0, "by_platform": {}}
    
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    orders = await db.delivery_orders.find(query, {"_id": 0}).to_list(10000)
    
    by_platform = {}
    for order in orders:
        platform = order.get("platform", "unknown")
        if platform not in by_platform:
            by_platform[platform] = {"count": 0, "revenue": 0}
        by_platform[platform]["count"] += 1
        by_platform[platform]["revenue"] += order.get("total", 0)
    
    return {
        "total_orders": len(orders),
        "total_revenue": sum(o.get("total", 0) for o in orders),
        "by_platform": by_platform,
        "by_status": {
            "new": sum(1 for o in orders if o.get("status") == "new"),
            "accepted": sum(1 for o in orders if o.get("status") == "accepted"),
            "preparing": sum(1 for o in orders if o.get("status") == "preparing"),
            "ready": sum(1 for o in orders if o.get("status") == "ready"),
            "delivered": sum(1 for o in orders if o.get("status") == "delivered"),
            "cancelled": sum(1 for o in orders if o.get("status") == "cancelled"),
            "rejected": sum(1 for o in orders if o.get("status") == "rejected")
        }
    }
