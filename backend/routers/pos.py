"""POS Router - Adisyon/Kasa İşlemleri"""
import uuid
import socket
import json
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from pydantic import BaseModel

from utils.auth import get_current_user, get_current_dealer
from utils.database import get_db

router = APIRouter(prefix="/pos", tags=["POS"])

# ==================== PYDANTIC MODELS ====================

class SectionCreate(BaseModel):
    name: str
    color: Optional[str] = "#f97316"
    order: Optional[int] = 0

class TableCreate(BaseModel):
    name: str
    section_id: str
    capacity: Optional[int] = 4
    position_x: Optional[int] = 0
    position_y: Optional[int] = 0
    shape: Optional[str] = "square"  # square, round, rectangle

class OrderItemCreate(BaseModel):
    product_id: str
    product_name: str
    price: float
    quantity: int = 1
    note: Optional[str] = ""
    portion: Optional[str] = "tam"  # tam, yarim

class POSOrderCreate(BaseModel):
    table_id: Optional[str] = None
    source: str = "table"  # table, takeaway, delivery
    items: List[OrderItemCreate]
    customer_name: Optional[str] = ""
    customer_phone: Optional[str] = ""
    notes: Optional[str] = ""
    discount_type: Optional[str] = None  # percent, fixed
    discount_value: Optional[float] = 0

class PaymentCreate(BaseModel):
    method: str  # cash, card, online, sodexo, multinet, setcard, mixed
    amount: float
    tip: Optional[float] = 0
    split_count: Optional[int] = 1

# ==================== SALON/BÖLGE YÖNETİMİ ====================

@router.get("/sections")
async def get_sections(current_user: dict = Depends(get_current_user)):
    """Tüm salonları/bölgeleri getir"""
    db = get_db()
    if db is None:
        return []
    sections = await db.pos_sections.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    if not sections:
        # Varsayılan salonları oluştur
        default_sections = [
            {"id": "section-1", "name": "İç Salon", "color": "#f97316", "order": 1},
            {"id": "section-2", "name": "Bahçe", "color": "#22c55e", "order": 2},
            {"id": "section-3", "name": "Teras", "color": "#3b82f6", "order": 3},
            {"id": "section-4", "name": "VIP", "color": "#a855f7", "order": 4}
        ]
        for s in default_sections:
            s_copy = {**s, "created_at": datetime.now(timezone.utc).isoformat()}
            await db.pos_sections.insert_one(s_copy)
        return default_sections
    return sections

@router.post("/sections")
async def create_section(section: SectionCreate, current_user: dict = Depends(get_current_user)):
    """Yeni salon/bölge oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    section_doc = {
        "id": str(uuid.uuid4()),
        "name": section.name,
        "color": section.color,
        "order": section.order,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pos_sections.insert_one(section_doc)
    section_doc.pop("_id", None)
    return section_doc

@router.put("/sections/{section_id}")
async def update_section(section_id: str, section: SectionCreate, current_user: dict = Depends(get_current_user)):
    """Salon/bölge güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_sections.update_one(
        {"id": section_id},
        {"$set": {"name": section.name, "color": section.color, "order": section.order}}
    )
    return {"status": "success"}

@router.delete("/sections/{section_id}")
async def delete_section(section_id: str, current_user: dict = Depends(get_current_user)):
    """Salon/bölge sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_sections.delete_one({"id": section_id})
    await db.pos_tables.delete_many({"section_id": section_id})
    return {"status": "success"}

# ==================== MASA YÖNETİMİ ====================

@router.get("/tables")
async def get_pos_tables(section_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Tüm masaları getir"""
    db = get_db()
    if db is None:
        return []
    
    query = {}
    if section_id:
        query["section_id"] = section_id
    
    tables = await db.pos_tables.find(query, {"_id": 0}).to_list(200)
    
    if not tables:
        # Varsayılan masaları oluştur
        sections = await db.pos_sections.find({}, {"_id": 0}).to_list(10)
        if not sections:
            sections = [{"id": "section-1", "name": "İç Salon"}]
        
        default_tables = []
        for i in range(1, 16):
            section = sections[0] if i <= 10 else (sections[1] if len(sections) > 1 else sections[0])
            table = {
                "id": f"table-{i}",
                "name": f"Masa {i}",
                "section_id": section["id"],
                "section_name": section["name"],
                "capacity": 4 if i % 3 != 0 else 6,
                "status": "empty",
                "current_order_id": None,
                "current_order": None,
                "position_x": ((i-1) % 5) * 120,
                "position_y": ((i-1) // 5) * 120,
                "shape": "square",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            default_tables.append(table)
            await db.pos_tables.insert_one(table)
        return default_tables
    
    # Her masa için aktif sipariş bilgisini ekle
    for table in tables:
        if table.get("current_order_id"):
            order = await db.pos_orders.find_one(
                {"id": table["current_order_id"]},
                {"_id": 0}
            )
            table["current_order"] = order
    
    return tables

@router.post("/tables")
async def create_pos_table(table: TableCreate, current_user: dict = Depends(get_current_user)):
    """Yeni masa oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Salon bilgisini al
    section = await db.pos_sections.find_one({"id": table.section_id}, {"_id": 0})
    section_name = section["name"] if section else "Salon"
    
    table_doc = {
        "id": str(uuid.uuid4()),
        "name": table.name,
        "section_id": table.section_id,
        "section_name": section_name,
        "capacity": table.capacity,
        "status": "empty",
        "current_order_id": None,
        "current_order": None,
        "position_x": table.position_x,
        "position_y": table.position_y,
        "shape": table.shape,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pos_tables.insert_one(table_doc)
    table_doc.pop("_id", None)
    return {"status": "success", "table": table_doc}

@router.put("/tables/{table_id}")
async def update_table(table_id: str, table: TableCreate, current_user: dict = Depends(get_current_user)):
    """Masa güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    section = await db.pos_sections.find_one({"id": table.section_id}, {"_id": 0})
    section_name = section["name"] if section else "Salon"
    
    await db.pos_tables.update_one(
        {"id": table_id},
        {"$set": {
            "name": table.name,
            "section_id": table.section_id,
            "section_name": section_name,
            "capacity": table.capacity,
            "position_x": table.position_x,
            "position_y": table.position_y,
            "shape": table.shape
        }}
    )
    return {"status": "success"}

@router.put("/tables/{table_id}/status")
async def update_table_status(table_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Masa durumunu güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    update_data = {"status": status}
    if status == "empty":
        update_data["current_order_id"] = None
        update_data["current_order"] = None
    
    await db.pos_tables.update_one({"id": table_id}, {"$set": update_data})
    return {"status": "success"}

@router.delete("/tables/{table_id}")
async def delete_table(table_id: str, current_user: dict = Depends(get_current_user)):
    """Masa sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_tables.delete_one({"id": table_id})
    return {"status": "success"}

@router.post("/tables/{table_id}/merge/{target_table_id}")
async def merge_tables(table_id: str, target_table_id: str, current_user: dict = Depends(get_current_user)):
    """İki masayı birleştir"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    source_table = await db.pos_tables.find_one({"id": table_id}, {"_id": 0})
    target_table = await db.pos_tables.find_one({"id": target_table_id}, {"_id": 0})
    
    if not source_table or not target_table:
        raise HTTPException(status_code=404, detail="Masa bulunamadı")
    
    # Kaynak masanın siparişini hedef masaya taşı
    if source_table.get("current_order_id"):
        await db.pos_orders.update_one(
            {"id": source_table["current_order_id"]},
            {"$set": {"table_id": target_table_id, "merged_from": table_id}}
        )
        
        # Hedef masayı güncelle
        await db.pos_tables.update_one(
            {"id": target_table_id},
            {"$set": {
                "status": "occupied",
                "current_order_id": source_table["current_order_id"],
                "merged_tables": [table_id]
            }}
        )
    
    # Kaynak masayı boşalt
    await db.pos_tables.update_one(
        {"id": table_id},
        {"$set": {"status": "merged", "merged_to": target_table_id, "current_order_id": None}}
    )
    
    return {"status": "success", "message": "Masalar birleştirildi"}

@router.post("/tables/{table_id}/transfer/{target_table_id}")
async def transfer_table(table_id: str, target_table_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişi başka masaya aktar"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    source_table = await db.pos_tables.find_one({"id": table_id}, {"_id": 0})
    target_table = await db.pos_tables.find_one({"id": target_table_id}, {"_id": 0})
    
    if not source_table or not target_table:
        raise HTTPException(status_code=404, detail="Masa bulunamadı")
    
    if target_table.get("status") != "empty":
        raise HTTPException(status_code=400, detail="Hedef masa dolu")
    
    if source_table.get("current_order_id"):
        # Siparişi güncelle
        await db.pos_orders.update_one(
            {"id": source_table["current_order_id"]},
            {"$set": {"table_id": target_table_id}}
        )
        
        # Masaları güncelle
        await db.pos_tables.update_one(
            {"id": target_table_id},
            {"$set": {"status": "occupied", "current_order_id": source_table["current_order_id"]}}
        )
        await db.pos_tables.update_one(
            {"id": table_id},
            {"$set": {"status": "empty", "current_order_id": None}}
        )
    
    return {"status": "success", "message": "Sipariş aktarıldı"}

# ==================== SİPARİŞ YÖNETİMİ ====================

@router.get("/orders")
async def get_pos_orders(
    status: Optional[str] = None,
    table_id: Optional[str] = None,
    source: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Siparişleri getir"""
    db = get_db()
    if db is None:
        return []
    
    query = {}
    if status:
        query["status"] = status
    if table_id:
        query["table_id"] = table_id
    if source:
        query["source"] = source
    
    orders = await db.pos_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders

@router.get("/orders/{order_id}")
async def get_pos_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Tek sipariş getir"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return order

@router.post("/orders")
async def create_pos_order(order: POSOrderCreate, current_user: dict = Depends(get_current_user)):
    """Yeni sipariş oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order_id = str(uuid.uuid4())
    pos_count = await db.pos_orders.count_documents({})
    order_number = f"A{str(pos_count + 1).zfill(6)}"
    
    # Toplam hesapla
    subtotal = sum(item.price * item.quantity for item in order.items)
    discount_amount = 0
    if order.discount_type == "percent":
        discount_amount = subtotal * (order.discount_value / 100)
    elif order.discount_type == "fixed":
        discount_amount = order.discount_value
    
    total = subtotal - discount_amount
    
    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "table_id": order.table_id,
        "source": order.source,
        "items": [item.model_dump() for item in order.items],
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "notes": order.notes,
        "subtotal": subtotal,
        "discount_type": order.discount_type,
        "discount_value": order.discount_value,
        "discount_amount": discount_amount,
        "total": total,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.get("email") or current_user.get("code", "unknown")
    }
    
    await db.pos_orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    
    # Masa varsa güncelle
    if order.table_id:
        await db.pos_tables.update_one(
            {"id": order.table_id},
            {"$set": {"status": "occupied", "current_order_id": order_id}}
        )
    
    return {"status": "success", "order": order_doc}

@router.put("/orders/{order_id}")
async def update_pos_order(order_id: str, order: POSOrderCreate, current_user: dict = Depends(get_current_user)):
    """Siparişi güncelle (ürün ekle/çıkar)"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    subtotal = sum(item.price * item.quantity for item in order.items)
    discount_amount = 0
    if order.discount_type == "percent":
        discount_amount = subtotal * (order.discount_value / 100)
    elif order.discount_type == "fixed":
        discount_amount = order.discount_value
    
    total = subtotal - discount_amount
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {
            "items": [item.model_dump() for item in order.items],
            "notes": order.notes,
            "subtotal": subtotal,
            "discount_type": order.discount_type,
            "discount_value": order.discount_value,
            "discount_amount": discount_amount,
            "total": total,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    return {"status": "success", "order": updated}

@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Sipariş durumunu güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success"}

@router.post("/orders/{order_id}/items")
async def add_order_item(order_id: str, item: OrderItemCreate, current_user: dict = Depends(get_current_user)):
    """Siparişe ürün ekle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    items = order.get("items", [])
    items.append(item.model_dump())
    
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    discount_amount = order.get("discount_amount", 0)
    total = subtotal - discount_amount
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"items": items, "subtotal": subtotal, "total": total}}
    )
    
    return {"status": "success"}

@router.delete("/orders/{order_id}/items/{item_index}")
async def remove_order_item(order_id: str, item_index: int, current_user: dict = Depends(get_current_user)):
    """Siparişten ürün çıkar"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    items = order.get("items", [])
    if 0 <= item_index < len(items):
        items.pop(item_index)
    
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    discount_amount = order.get("discount_amount", 0)
    total = subtotal - discount_amount
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"items": items, "subtotal": subtotal, "total": total}}
    )
    
    return {"status": "success"}

@router.post("/orders/{order_id}/ikram/{item_index}")
async def mark_item_as_ikram(order_id: str, item_index: int, reason: str = "", current_user: dict = Depends(get_current_user)):
    """Ürünü ikram olarak işaretle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    items = order.get("items", [])
    if 0 <= item_index < len(items):
        items[item_index]["is_ikram"] = True
        items[item_index]["ikram_reason"] = reason
        items[item_index]["original_price"] = items[item_index]["price"]
        items[item_index]["price"] = 0
    
    subtotal = sum(i["price"] * i["quantity"] for i in items)
    discount_amount = order.get("discount_amount", 0)
    total = subtotal - discount_amount
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"items": items, "subtotal": subtotal, "total": total}}
    )
    
    return {"status": "success"}

# ==================== ÖDEME İŞLEMLERİ ====================

@router.post("/orders/{order_id}/pay")
async def pay_pos_order(order_id: str, payment: PaymentCreate, current_user: dict = Depends(get_current_user)):
    """Sipariş ödemesi al"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    payment_record = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "order_number": order.get("order_number"),
        "amount": payment.amount,
        "tip": payment.tip,
        "total_received": payment.amount + payment.tip,
        "method": payment.method,
        "split_count": payment.split_count,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.get("email") or current_user.get("code")
    }
    
    await db.pos_payments.insert_one(payment_record)
    payment_record.pop("_id", None)
    
    # Siparişi tamamla
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "completed",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "payment_method": payment.method,
            "tip": payment.tip
        }}
    )
    
    # Masayı boşalt
    if order.get("table_id"):
        await db.pos_tables.update_one(
            {"id": order["table_id"]},
            {"$set": {"status": "empty", "current_order_id": None}}
        )
    
    return {"status": "success", "payment": payment_record}

@router.post("/orders/{order_id}/split-pay")
async def split_pay_order(order_id: str, payments: List[PaymentCreate], current_user: dict = Depends(get_current_user)):
    """Hesabı bölerek öde"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    total_paid = sum(p.amount for p in payments)
    total_tip = sum(p.tip for p in payments)
    
    if total_paid < order.get("total", 0):
        raise HTTPException(status_code=400, detail="Ödeme tutarı yetersiz")
    
    payment_records = []
    for i, payment in enumerate(payments):
        record = {
            "id": str(uuid.uuid4()),
            "order_id": order_id,
            "order_number": order.get("order_number"),
            "amount": payment.amount,
            "tip": payment.tip,
            "method": payment.method,
            "split_index": i + 1,
            "split_total": len(payments),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.get("email") or current_user.get("code")
        }
        await db.pos_payments.insert_one(record)
        record.pop("_id", None)
        payment_records.append(record)
    
    # Siparişi tamamla
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "completed",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "payment_method": "split",
            "tip": total_tip,
            "split_payments": len(payments)
        }}
    )
    
    # Masayı boşalt
    if order.get("table_id"):
        await db.pos_tables.update_one(
            {"id": order["table_id"]},
            {"$set": {"status": "empty", "current_order_id": None}}
        )
    
    return {"status": "success", "payments": payment_records}

# ==================== MUTFAK EKRANI ====================

@router.get("/kitchen")
async def get_kitchen_orders(current_user: dict = Depends(get_current_user)):
    """Mutfak siparişlerini getir"""
    db = get_db()
    if db is None:
        return []
    
    orders = await db.pos_orders.find(
        {"status": {"$in": ["pending", "preparing", "ready"]}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    return orders

@router.put("/kitchen/{order_id}/preparing")
async def mark_preparing(order_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişi hazırlanıyor olarak işaretle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "preparing", "preparing_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success"}

@router.put("/kitchen/{order_id}/ready")
async def mark_ready(order_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişi hazır olarak işaretle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "ready", "ready_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success"}

@router.put("/kitchen/{order_id}/served")
async def mark_served(order_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişi servis edildi olarak işaretle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.pos_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "served", "served_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "success"}

# ==================== RAPORLAR ====================

@router.get("/reports/summary")
async def get_pos_summary(range: str = "today", current_user: dict = Depends(get_current_user)):
    """Satış özeti raporu"""
    db = get_db()
    if db is None:
        return {
            "totalSales": 0, "totalOrders": 0, "averageOrder": 0,
            "cashSales": 0, "cardSales": 0, "onlineSales": 0, "mealCardSales": 0,
            "tableOrders": 0, "takeawayOrders": 0, "deliveryOrders": 0,
            "tips": 0, "discounts": 0, "ikrams": 0
        }
    
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
    
    # Hesaplamalar
    total_sales = sum(p.get("amount", 0) for p in payments)
    cash_sales = sum(p.get("amount", 0) for p in payments if p.get("method") == "cash")
    card_sales = sum(p.get("amount", 0) for p in payments if p.get("method") == "card")
    online_sales = sum(p.get("amount", 0) for p in payments if p.get("method") == "online")
    meal_card_sales = sum(p.get("amount", 0) for p in payments if p.get("method") in ["sodexo", "multinet", "ticket", "setcard"])
    tips = sum(p.get("tip", 0) for p in payments)
    discounts = sum(o.get("discount_amount", 0) for o in pos_orders)
    
    return {
        "totalSales": total_sales,
        "totalOrders": len(pos_orders),
        "averageOrder": total_sales / len(pos_orders) if pos_orders else 0,
        "cashSales": cash_sales,
        "cardSales": card_sales,
        "onlineSales": online_sales,
        "mealCardSales": meal_card_sales,
        "tableOrders": sum(1 for o in pos_orders if o.get("source") == "table"),
        "takeawayOrders": sum(1 for o in pos_orders if o.get("source") == "takeaway"),
        "deliveryOrders": sum(1 for o in pos_orders if o.get("source") == "delivery"),
        "tips": tips,
        "discounts": discounts
    }

@router.get("/reports/z-report")
async def get_z_report(current_user: dict = Depends(get_current_user)):
    """Z Raporu - Günlük kasa kapanış raporu"""
    db = get_db()
    if db is None:
        return {"error": "Veritabanı bağlantısı yok"}
    
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # Günlük siparişler
    orders = await db.pos_orders.find(
        {"created_at": {"$gte": start_of_day}, "status": "completed"},
        {"_id": 0}
    ).to_list(1000)
    
    # Günlük ödemeler
    payments = await db.pos_payments.find(
        {"created_at": {"$gte": start_of_day}},
        {"_id": 0}
    ).to_list(1000)
    
    # Ödeme yöntemlerine göre gruplama
    payment_breakdown = {}
    for p in payments:
        method = p.get("method", "other")
        if method not in payment_breakdown:
            payment_breakdown[method] = {"count": 0, "total": 0}
        payment_breakdown[method]["count"] += 1
        payment_breakdown[method]["total"] += p.get("amount", 0)
    
    return {
        "date": now.strftime("%Y-%m-%d"),
        "generated_at": now.isoformat(),
        "total_orders": len(orders),
        "total_sales": sum(p.get("amount", 0) for p in payments),
        "total_tips": sum(p.get("tip", 0) for p in payments),
        "total_discounts": sum(o.get("discount_amount", 0) for o in orders),
        "payment_breakdown": payment_breakdown,
        "order_sources": {
            "table": sum(1 for o in orders if o.get("source") == "table"),
            "takeaway": sum(1 for o in orders if o.get("source") == "takeaway"),
            "delivery": sum(1 for o in orders if o.get("source") == "delivery")
        }
    }
