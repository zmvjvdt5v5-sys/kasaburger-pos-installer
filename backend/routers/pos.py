"""POS Router - Adisyon/Kasa İşlemleri"""
import uuid
import socket
import json
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List

from models.pos import (
    POSTableCreate, POSTableResponse, POSOrderCreate, POSOrderResponse,
    POSPaymentCreate, InPOSConfig, InPOSPaymentRequest, InPOSFiscalRequest
)
from utils.auth import get_current_user, get_current_dealer
from utils.database import get_db

router = APIRouter(prefix="/pos", tags=["POS"])

# ==================== MASA YÖNETİMİ ====================

@router.get("/tables")
async def get_pos_tables(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    tables = await db.pos_tables.find({}, {"_id": 0}).to_list(100)
    return tables

@router.post("/tables")
async def create_pos_table(table: POSTableCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    table_doc = {
        "id": str(uuid.uuid4()),
        "name": table.name,
        "status": "empty",
        "capacity": table.capacity,
        "section": table.section,
        "current_order_id": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pos_tables.insert_one(table_doc)
    table_doc.pop("_id", None)
    return {"status": "success", "table": table_doc}

@router.put("/tables/{table_id}/status")
async def update_table_status(table_id: str, status: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_tables.update_one(
        {"id": table_id},
        {"$set": {"status": status}}
    )
    return {"status": "success"}

# ==================== SİPARİŞ YÖNETİMİ ====================

@router.get("/orders")
async def get_pos_orders(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.pos_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@router.post("/orders")
async def create_pos_order(order: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order["id"] = str(uuid.uuid4())
    pos_count = await db.pos_orders.count_documents({})
    order["order_number"] = f"POS-{str(pos_count + 1).zfill(6)}"
    order["created_at"] = datetime.now(timezone.utc).isoformat()
    order["created_by"] = current_user.get("email") or current_user.get("dealer_code") or current_user.get("code")
    order["status"] = order.get("status", "pending")
    
    await db.pos_orders.insert_one(order)
    order.pop("_id", None)
    
    if order.get("table_id"):
        await db.pos_tables.update_one(
            {"id": order["table_id"]},
            {"$set": {"status": "occupied", "current_order_id": order["id"]}}
        )
    
    return {"status": "success", "order": order}

@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success"}

@router.post("/orders/{order_id}/pay")
async def pay_pos_order(order_id: str, payment: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    payment_record = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "amount": payment.get("amount", order.get("total", 0)),
        "method": payment.get("method", "cash"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.get("email") or current_user.get("code")
    }
    
    await db.pos_payments.insert_one(payment_record)
    payment_record.pop("_id", None)
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "completed", "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if order.get("table_id"):
        await db.pos_tables.update_one(
            {"id": order["table_id"]},
            {"$set": {"status": "empty", "current_order_id": None}}
        )
    
    return {"status": "success", "payment": payment_record}

# ==================== MUTFAK EKRANI ====================

@router.get("/kitchen")
async def get_kitchen_orders(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    
    orders = await db.pos_orders.find(
        {"status": {"$in": ["pending", "preparing", "ready"]}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    return orders

# ==================== RAPORLAR ====================

@router.get("/reports/summary")
async def get_pos_summary(range: str = "today", current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return {
            "totalSales": 0, "totalOrders": 0, "averageOrder": 0,
            "cashSales": 0, "cardSales": 0, "onlineSales": 0, "mealCardSales": 0,
            "tableOrders": 0, "takeawayOrders": 0, "deliveryOrders": 0,
            "yemeksepetiOrders": 0, "yemeksepetiRevenue": 0,
            "getirOrders": 0, "getirRevenue": 0,
            "trendyolOrders": 0, "trendyolRevenue": 0,
            "migrosOrders": 0, "migrosRevenue": 0
        }
    
    # Tarih aralığı
    now = datetime.now(timezone.utc)
    if range == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range == "week":
        start_date = now - timedelta(days=7)
    elif range == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    start_str = start_date.isoformat()
    
    # POS siparişleri
    pos_orders = await db.pos_orders.find(
        {"created_at": {"$gte": start_str}, "status": "completed"},
        {"_id": 0}
    ).to_list(1000)
    
    # Ödemeler
    payments = await db.pos_payments.find(
        {"created_at": {"$gte": start_str}},
        {"_id": 0}
    ).to_list(1000)
    
    # Delivery siparişleri
    delivery_orders = await db.delivery_orders.find(
        {"created_at": {"$gte": start_str}},
        {"_id": 0}
    ).to_list(1000)
    
    # Hesaplamalar
    total_sales = sum(p.get("amount", 0) for p in payments)
    cash_sales = sum(p.get("amount", 0) for p in payments if p.get("method") == "cash")
    card_sales = sum(p.get("amount", 0) for p in payments if p.get("method") == "card")
    online_sales = sum(p.get("amount", 0) for p in payments if p.get("method") == "online")
    meal_card_sales = sum(p.get("amount", 0) for p in payments if p.get("method") in ["sodexo", "multinet", "ticket", "setcard"])
    
    # Platform bazlı
    yemeksepeti_orders = sum(1 for o in delivery_orders if o.get("platform") == "yemeksepeti")
    yemeksepeti_revenue = sum(o.get("total", 0) for o in delivery_orders if o.get("platform") == "yemeksepeti")
    getir_orders = sum(1 for o in delivery_orders if o.get("platform") == "getir")
    getir_revenue = sum(o.get("total", 0) for o in delivery_orders if o.get("platform") == "getir")
    trendyol_orders = sum(1 for o in delivery_orders if o.get("platform") == "trendyol")
    trendyol_revenue = sum(o.get("total", 0) for o in delivery_orders if o.get("platform") == "trendyol")
    migros_orders = sum(1 for o in delivery_orders if o.get("platform") == "migros")
    migros_revenue = sum(o.get("total", 0) for o in delivery_orders if o.get("platform") == "migros")
    
    total_revenue = total_sales + yemeksepeti_revenue + getir_revenue + trendyol_revenue + migros_revenue
    total_order_count = len(pos_orders) + len(delivery_orders)
    
    return {
        "totalSales": total_revenue,
        "totalOrders": total_order_count,
        "averageOrder": total_revenue / total_order_count if total_order_count > 0 else 0,
        "cashSales": cash_sales,
        "cardSales": card_sales,
        "onlineSales": online_sales,
        "mealCardSales": meal_card_sales,
        "tableOrders": sum(1 for o in pos_orders if o.get("source") == "table"),
        "takeawayOrders": sum(1 for o in pos_orders if o.get("source") == "takeaway"),
        "deliveryOrders": yemeksepeti_orders + getir_orders + trendyol_orders + migros_orders,
        "yemeksepetiOrders": yemeksepeti_orders,
        "yemeksepetiRevenue": yemeksepeti_revenue,
        "getirOrders": getir_orders,
        "getirRevenue": getir_revenue,
        "trendyolOrders": trendyol_orders,
        "trendyolRevenue": trendyol_revenue,
        "migrosOrders": migros_orders,
        "migrosRevenue": migros_revenue
    }

@router.get("/reports/top-products")
async def get_top_products(range: str = "today", current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    
    # Basit implementasyon - gerçek aggregation için genişletilebilir
    return []

@router.get("/reports/hourly")
async def get_hourly_sales(range: str = "today", current_user: dict = Depends(get_current_user)):
    return []
