"""Kitchen Router - Birleşik Mutfak Yönetim Sistemi"""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from pydantic import BaseModel
import socket
import struct

from utils.auth import get_current_user, get_current_dealer
from utils.database import get_db

router = APIRouter(prefix="/kitchen", tags=["Kitchen"])


# ==================== PYDANTIC MODELS ====================

class OrderStatusUpdate(BaseModel):
    status: str  # pending, preparing, ready, served, delivered

class PrintRequest(BaseModel):
    order_id: str
    printer_ip: Optional[str] = "192.168.1.100"
    printer_port: Optional[int] = 9100


# ==================== SIRA NUMARASI YÖNETİMİ ====================

async def get_daily_queue_number(db, prefix: str) -> str:
    """Günlük sıfırlanan sıra numarası üret"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Bugünkü counter'ı al veya oluştur
    counter = await db.queue_counters.find_one(
        {"prefix": prefix, "date": today},
        {"_id": 0}
    )
    
    if counter:
        new_count = counter.get("count", 0) + 1
    else:
        new_count = 1
    
    # Counter'ı güncelle veya oluştur
    await db.queue_counters.update_one(
        {"prefix": prefix, "date": today},
        {"$set": {"count": new_count, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return f"{prefix}-{str(new_count).zfill(4)}"


def generate_order_code(source: str, table_name: str = None, platform: str = None) -> dict:
    """Sipariş kodunu ve tipini belirle
    
    Returns:
        dict: {
            "display_code": "MASA-5" veya "PKT-0001" veya "ONLNPKT-0001",
            "code_type": "table" | "package" | "online",
            "prefix": "MASA" | "PKT" | "ONLNPKT"
        }
    """
    if source == "table" and table_name:
        # Masa siparişi - masa numarasını kullan
        table_num = table_name.replace("Masa ", "").replace("masa ", "").strip()
        return {
            "display_code": f"MASA-{table_num}",
            "code_type": "table",
            "prefix": "MASA"
        }
    elif source in ["takeaway", "delivery", "package"]:
        # Paket sipariş
        return {
            "display_code": None,  # DB'den alınacak
            "code_type": "package",
            "prefix": "PKT"
        }
    elif platform or source in ["yemeksepeti", "getir", "trendyol", "migros"]:
        # Online platform siparişi
        return {
            "display_code": None,  # DB'den alınacak
            "code_type": "online",
            "prefix": "ONLNPKT"
        }
    else:
        # Varsayılan - kiosk vb.
        return {
            "display_code": None,
            "code_type": "kiosk",
            "prefix": "PKT"
        }


# ==================== BİRLEŞİK MUTFAK SİPARİŞLERİ ====================

@router.get("/orders")
async def get_all_kitchen_orders(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Tüm kaynaklardan mutfak siparişlerini getir (POS, Kiosk, Delivery)"""
    db = get_db()
    if db is None:
        return []
    
    all_orders = []
    
    # Filtre durumları
    if status:
        status_list = status.split(",")
    else:
        # Hem İngilizce hem Türkçe durum isimleri
        status_list = ["pending", "preparing", "ready", "Yeni", "confirmed", "Hazırlanıyor", "Hazır"]
    
    # 1. POS Siparişleri
    pos_query = {"status": {"$in": status_list}}
    pos_orders = await db.pos_orders.find(pos_query, {"_id": 0}).to_list(200)
    
    for order in pos_orders:
        # Masa bilgisini al
        table_name = None
        if order.get("table_id"):
            table = await db.pos_tables.find_one({"id": order["table_id"]}, {"_id": 0})
            table_name = table.get("name") if table else None
        
        # Kod oluştur
        code_info = generate_order_code(
            source=order.get("source", "table"),
            table_name=table_name,
            platform=order.get("platform")
        )
        
        all_orders.append({
            **order,
            "order_source": "pos",
            "display_code": code_info["display_code"] or order.get("queue_number") or order.get("order_number"),
            "code_type": code_info["code_type"],
            "table_name": table_name,
            "queue_number": order.get("queue_number")
        })
    
    # 2. Kiosk Siparişleri
    kiosk_query = {"status": {"$in": status_list + ["Yeni", "Hazırlanıyor"]}}
    kiosk_orders = await db.kiosk_orders.find(kiosk_query, {"_id": 0}).to_list(200)
    
    for order in kiosk_orders:
        all_orders.append({
            **order,
            "order_source": "kiosk",
            "display_code": order.get("queue_number") or f"KIOSK-{order.get('order_number', '???')[-4:]}",
            "code_type": "kiosk",
            "source": "kiosk",
            "queue_number": order.get("queue_number")
        })
    
    # 3. Delivery Platform Siparişleri
    delivery_query = {"status": {"$in": status_list + ["confirmed", "accepted"]}}
    delivery_orders = await db.delivery_orders.find(delivery_query, {"_id": 0}).to_list(200)
    
    for order in delivery_orders:
        platform = order.get("platform", "online")
        all_orders.append({
            **order,
            "order_source": "delivery",
            "display_code": order.get("queue_number") or f"ONLNPKT-{order.get('external_id', '???')[-4:]}",
            "code_type": "online",
            "source": platform,
            "queue_number": order.get("queue_number")
        })
    
    # Zamana göre sırala (en eski önce)
    all_orders.sort(key=lambda x: x.get("created_at", ""), reverse=False)
    
    return all_orders


@router.get("/orders/ready")
async def get_ready_orders(current_user: dict = Depends(get_current_user)):
    """Hazır olan siparişleri getir (Salon ekranı için)"""
    db = get_db()
    if db is None:
        return []
    
    ready_orders = []
    
    # POS siparişleri
    pos_ready = await db.pos_orders.find(
        {"status": "ready"},
        {"_id": 0}
    ).sort("ready_at", -1).to_list(50)
    
    for order in pos_ready:
        table_name = None
        if order.get("table_id"):
            table = await db.pos_tables.find_one({"id": order["table_id"]}, {"_id": 0})
            table_name = table.get("name") if table else None
        
        ready_orders.append({
            "id": order.get("id"),
            "display_code": order.get("queue_number") or order.get("order_number"),
            "code_type": "table" if order.get("table_id") else "package",
            "table_name": table_name,
            "ready_at": order.get("ready_at"),
            "source": order.get("source", "table")
        })
    
    # Kiosk siparişleri
    kiosk_ready = await db.kiosk_orders.find(
        {"status": {"$in": ["ready", "Hazır"]}},
        {"_id": 0}
    ).sort("ready_at", -1).to_list(50)
    
    for order in kiosk_ready:
        ready_orders.append({
            "id": order.get("id"),
            "display_code": order.get("queue_number"),
            "code_type": "kiosk",
            "ready_at": order.get("ready_at"),
            "source": "kiosk"
        })
    
    return ready_orders


@router.get("/salon-display")
async def get_salon_display_data():
    """Salon ekranı için hazır ve hazırlanan siparişleri getir (Auth gerektirmez)"""
    db = get_db()
    if db is None:
        return {"ready_orders": [], "preparing_orders": [], "calling_orders": []}
    
    # Son 24 saat içinde hazır olan siparişler veya ready_at olmayan ready siparişler
    one_day_ago = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    
    ready_orders = []
    preparing_orders = []
    
    # POS ready siparişleri
    pos_ready = await db.pos_orders.find(
        {"status": "ready", "$or": [
            {"ready_at": {"$gte": one_day_ago}},
            {"ready_at": {"$exists": False}},
            {"ready_at": None}
        ]},
        {"_id": 0, "id": 1, "queue_number": 1, "order_number": 1, "source": 1, "table_id": 1, "ready_at": 1}
    ).sort("updated_at", -1).to_list(20)
    
    for order in pos_ready:
        display = order.get("queue_number") or order.get("order_number", "---")
        ready_orders.append({
            "display_code": display,
            "source": order.get("source", "table"),
            "ready_at": order.get("ready_at")
        })
    
    # POS preparing siparişleri (pending dahil - yeni siparişler de hazırlanıyor olarak göster)
    pos_preparing = await db.pos_orders.find(
        {"status": {"$in": ["preparing", "pending"]}},
        {"_id": 0, "id": 1, "queue_number": 1, "order_number": 1, "source": 1}
    ).sort("preparing_at", -1).to_list(20)
    
    for order in pos_preparing:
        display = order.get("queue_number") or order.get("order_number", "---")
        preparing_orders.append({
            "display_code": display,
            "source": order.get("source", "table")
        })
    
    # Kiosk ready siparişleri
    kiosk_ready = await db.kiosk_orders.find(
        {"status": {"$in": ["ready", "Hazır"]}, "$or": [
            {"ready_at": {"$gte": one_day_ago}},
            {"ready_at": {"$exists": False}},
            {"ready_at": None}
        ]},
        {"_id": 0, "id": 1, "queue_number": 1, "order_number": 1, "ready_at": 1}
    ).sort("updated_at", -1).to_list(20)
    
    for order in kiosk_ready:
        # K-000004 -> KIOSK-0004 formatına çevir
        order_num = order.get("order_number", "")
        if order_num.startswith("K-"):
            try:
                num = int(order_num[2:])
                display = f"KIOSK-{num:04d}"
            except ValueError:
                display = order.get("queue_number") or order_num or "---"
        else:
            display = order.get("queue_number") or order_num or "---"
        ready_orders.append({
            "display_code": display,
            "source": "kiosk",
            "ready_at": order.get("ready_at")
        })
    
    # Kiosk preparing siparişleri (pending/Yeni dahil - yeni siparişler de hazırlanıyor olarak göster)
    kiosk_preparing = await db.kiosk_orders.find(
        {"status": {"$in": ["preparing", "Hazırlanıyor", "pending", "Yeni"]}},
        {"_id": 0, "id": 1, "queue_number": 1, "order_number": 1}
    ).sort("preparing_at", -1).to_list(20)
    
    for order in kiosk_preparing:
        # K-000004 -> KIOSK-0004 formatına çevir
        order_num = order.get("order_number", "")
        if order_num.startswith("K-"):
            try:
                num = int(order_num[2:])
                display = f"KIOSK-{num:04d}"
            except ValueError:
                display = order.get("queue_number") or order_num or "---"
        else:
            display = order.get("queue_number") or order_num or "---"
        preparing_orders.append({
            "display_code": display,
            "source": "kiosk"
        })
    
    return {
        "ready_orders": ready_orders,
        "preparing_orders": preparing_orders,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== SİPARİŞ DURUMU GÜNCELLEME ====================

@router.put("/orders/{order_id}/status")
async def update_kitchen_order_status(
    order_id: str,
    update: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Sipariş durumunu güncelle (Tüm kaynaklardan)"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    now = datetime.now(timezone.utc).isoformat()
    new_status = update.status
    
    # Durum alanlarını ayarla
    status_fields = {"status": new_status, "updated_at": now}
    
    if new_status == "preparing":
        status_fields["preparing_at"] = now
    elif new_status == "ready":
        status_fields["ready_at"] = now
    elif new_status == "served":
        status_fields["served_at"] = now
    elif new_status == "delivered":
        status_fields["delivered_at"] = now
    
    # Önce POS'ta ara
    pos_order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if pos_order:
        await db.pos_orders.update_one({"id": order_id}, {"$set": status_fields})
        return {"status": "success", "source": "pos", "new_status": new_status}
    
    # Kiosk'ta ara
    kiosk_order = await db.kiosk_orders.find_one({"id": order_id}, {"_id": 0})
    if kiosk_order:
        # Kiosk için Türkçe durum çevirisi
        kiosk_status_map = {
            "pending": "Yeni",
            "preparing": "Hazırlanıyor",
            "ready": "Hazır",
            "served": "Teslim Edildi"
        }
        status_fields["status"] = kiosk_status_map.get(new_status, new_status)
        await db.kiosk_orders.update_one({"id": order_id}, {"$set": status_fields})
        return {"status": "success", "source": "kiosk", "new_status": new_status}
    
    # Delivery'de ara
    delivery_order = await db.delivery_orders.find_one({"id": order_id}, {"_id": 0})
    if delivery_order:
        await db.delivery_orders.update_one({"id": order_id}, {"$set": status_fields})
        return {"status": "success", "source": "delivery", "new_status": new_status}
    
    raise HTTPException(status_code=404, detail="Sipariş bulunamadı")


@router.put("/orders/{order_id}/preparing")
async def mark_order_preparing(order_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişi hazırlanıyor olarak işaretle"""
    return await update_kitchen_order_status(
        order_id, 
        OrderStatusUpdate(status="preparing"), 
        current_user
    )


@router.put("/orders/{order_id}/ready")
async def mark_order_ready(order_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişi hazır olarak işaretle"""
    return await update_kitchen_order_status(
        order_id, 
        OrderStatusUpdate(status="ready"), 
        current_user
    )


@router.put("/orders/{order_id}/served")
async def mark_order_served(order_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişi teslim edildi olarak işaretle"""
    return await update_kitchen_order_status(
        order_id, 
        OrderStatusUpdate(status="served"), 
        current_user
    )


# ==================== SIRA NUMARASI ATAMA ====================

@router.post("/orders/{order_id}/assign-queue")
async def assign_queue_number(order_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişe sıra numarası ata"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Önce POS'ta ara
    pos_order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    if pos_order:
        # Zaten queue_number varsa döndür
        if pos_order.get("queue_number"):
            return {"queue_number": pos_order["queue_number"]}
        
        # Masa siparişi mi?
        if pos_order.get("table_id"):
            table = await db.pos_tables.find_one({"id": pos_order["table_id"]}, {"_id": 0})
            if table:
                queue_number = f"MASA-{table.get('name', '').replace('Masa ', '').strip()}"
            else:
                queue_number = await get_daily_queue_number(db, "PKT")
        elif pos_order.get("platform"):
            queue_number = await get_daily_queue_number(db, "ONLNPKT")
        else:
            queue_number = await get_daily_queue_number(db, "PKT")
        
        await db.pos_orders.update_one(
            {"id": order_id},
            {"$set": {"queue_number": queue_number}}
        )
        return {"queue_number": queue_number, "source": "pos"}
    
    # Kiosk'ta ara
    kiosk_order = await db.kiosk_orders.find_one({"id": order_id}, {"_id": 0})
    if kiosk_order:
        if kiosk_order.get("queue_number"):
            return {"queue_number": kiosk_order["queue_number"]}
        
        queue_number = await get_daily_queue_number(db, "PKT")
        await db.kiosk_orders.update_one(
            {"id": order_id},
            {"$set": {"queue_number": queue_number}}
        )
        return {"queue_number": queue_number, "source": "kiosk"}
    
    # Delivery'de ara
    delivery_order = await db.delivery_orders.find_one({"id": order_id}, {"_id": 0})
    if delivery_order:
        if delivery_order.get("queue_number"):
            return {"queue_number": delivery_order["queue_number"]}
        
        queue_number = await get_daily_queue_number(db, "ONLNPKT")
        await db.delivery_orders.update_one(
            {"id": order_id},
            {"$set": {"queue_number": queue_number}}
        )
        return {"queue_number": queue_number, "source": "delivery"}
    
    raise HTTPException(status_code=404, detail="Sipariş bulunamadı")


# ==================== TERMAL YAZICI ====================

def generate_receipt_text(order: dict, queue_number: str) -> str:
    """Termal yazıcı için fiş metni oluştur"""
    lines = []
    
    # Başlık
    lines.append("=" * 32)
    lines.append("      KASA BURGER".center(32))
    lines.append("=" * 32)
    lines.append("")
    
    # Sıra Numarası (Büyük)
    lines.append(f"  SIRA NO: {queue_number}".center(32))
    lines.append("")
    
    # Tarih/Saat
    now = datetime.now()
    lines.append(f"Tarih: {now.strftime('%d.%m.%Y %H:%M')}")
    lines.append("-" * 32)
    
    # Ürünler
    for item in order.get("items", []):
        qty = item.get("quantity", 1)
        name = item.get("product_name") or item.get("name", "Ürün")
        price = item.get("price", 0) * qty
        
        # Ürün satırı
        line = f"{qty}x {name[:20]}"
        price_str = f"{price:.2f} TL"
        padding = 32 - len(line) - len(price_str)
        lines.append(f"{line}{' ' * max(1, padding)}{price_str}")
        
        # Not varsa
        if item.get("note"):
            lines.append(f"   > {item['note'][:28]}")
    
    lines.append("-" * 32)
    
    # Toplam
    total = order.get("total", 0)
    lines.append(f"TOPLAM: {total:.2f} TL".rjust(32))
    
    # Sipariş notu
    if order.get("notes"):
        lines.append("")
        lines.append(f"Not: {order['notes'][:28]}")
    
    lines.append("")
    lines.append("=" * 32)
    lines.append("  Afiyet olsun!".center(32))
    lines.append("=" * 32)
    lines.append("\n\n\n")  # Kağıt kesme için boşluk
    
    return "\n".join(lines)


@router.post("/print")
async def print_kitchen_ticket(
    request: PrintRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mutfak fişi yazdır (Termal yazıcı)"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Siparişi bul
    order = await db.pos_orders.find_one({"id": request.order_id}, {"_id": 0})
    if not order:
        order = await db.kiosk_orders.find_one({"id": request.order_id}, {"_id": 0})
    if not order:
        order = await db.delivery_orders.find_one({"id": request.order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # Sıra numarası yoksa ata
    queue_number = order.get("queue_number")
    if not queue_number:
        result = await assign_queue_number(request.order_id, current_user)
        queue_number = result.get("queue_number", "---")
    
    # Fiş metnini oluştur
    receipt_text = generate_receipt_text(order, queue_number)
    
    # Termal yazıcıya gönder
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((request.printer_ip, request.printer_port))
        
        # ESC/POS komutları
        commands = b'\x1b\x40'  # Initialize
        commands += b'\x1b\x61\x01'  # Center align
        commands += receipt_text.encode('cp857', errors='replace')  # Türkçe karakter seti
        commands += b'\x1d\x56\x00'  # Cut paper
        
        sock.sendall(commands)
        sock.close()
        
        return {"status": "success", "message": "Fiş yazdırıldı", "queue_number": queue_number}
    except socket.timeout:
        return {"status": "warning", "message": "Yazıcı bağlantı zaman aşımı", "queue_number": queue_number, "receipt_text": receipt_text}
    except Exception as e:
        return {"status": "warning", "message": f"Yazıcı hatası: {str(e)}", "queue_number": queue_number, "receipt_text": receipt_text}


@router.get("/receipt/{order_id}")
async def get_receipt_data(order_id: str, current_user: dict = Depends(get_current_user)):
    """Fiş verilerini PDF/ekran için getir"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Siparişi bul
    order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
    source = "pos"
    if not order:
        order = await db.kiosk_orders.find_one({"id": order_id}, {"_id": 0})
        source = "kiosk"
    if not order:
        order = await db.delivery_orders.find_one({"id": order_id}, {"_id": 0})
        source = "delivery"
    
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # Sıra numarası yoksa ata
    queue_number = order.get("queue_number")
    if not queue_number:
        result = await assign_queue_number(order_id, current_user)
        queue_number = result.get("queue_number", "---")
    
    return {
        "order_id": order_id,
        "queue_number": queue_number,
        "order_number": order.get("order_number"),
        "source": source,
        "items": order.get("items", []),
        "subtotal": order.get("subtotal", 0),
        "discount_amount": order.get("discount_amount", 0),
        "total": order.get("total", 0),
        "notes": order.get("notes", ""),
        "created_at": order.get("created_at"),
        "customer_name": order.get("customer_name", ""),
        "customer_phone": order.get("customer_phone", "")
    }


# ==================== İSTATİSTİKLER ====================

@router.get("/stats")
async def get_kitchen_stats(current_user: dict = Depends(get_current_user)):
    """Mutfak istatistiklerini getir"""
    db = get_db()
    if db is None:
        return {"pending": 0, "preparing": 0, "ready": 0}
    
    # POS
    pos_pending = await db.pos_orders.count_documents({"status": "pending"})
    pos_preparing = await db.pos_orders.count_documents({"status": "preparing"})
    pos_ready = await db.pos_orders.count_documents({"status": "ready"})
    
    # Kiosk
    kiosk_pending = await db.kiosk_orders.count_documents({"status": {"$in": ["pending", "Yeni"]}})
    kiosk_preparing = await db.kiosk_orders.count_documents({"status": {"$in": ["preparing", "Hazırlanıyor"]}})
    kiosk_ready = await db.kiosk_orders.count_documents({"status": {"$in": ["ready", "Hazır"]}})
    
    # Delivery
    delivery_pending = await db.delivery_orders.count_documents({"status": {"$in": ["pending", "confirmed"]}})
    delivery_preparing = await db.delivery_orders.count_documents({"status": "preparing"})
    delivery_ready = await db.delivery_orders.count_documents({"status": "ready"})
    
    return {
        "pending": pos_pending + kiosk_pending + delivery_pending,
        "preparing": pos_preparing + kiosk_preparing + delivery_preparing,
        "ready": pos_ready + kiosk_ready + delivery_ready,
        "breakdown": {
            "pos": {"pending": pos_pending, "preparing": pos_preparing, "ready": pos_ready},
            "kiosk": {"pending": kiosk_pending, "preparing": kiosk_preparing, "ready": kiosk_ready},
            "delivery": {"pending": delivery_pending, "preparing": delivery_preparing, "ready": delivery_ready}
        }
    }


# ==================== SİPARİŞ TAKİP (Müşteri İçin - Auth Gerektirmez) ====================

@router.get("/track/{order_number}")
async def track_order_by_number(order_number: str):
    """Sipariş numarası ile sipariş durumunu takip et (Müşteri için - Auth gerektirmez)"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Normalize order number - KIOSK-0004 -> K-000004 dönüşümü
    search_terms = [order_number]
    
    # KIOSK-XXXX formatını K-XXXXXX formatına çevir
    if order_number.upper().startswith("KIOSK-"):
        num_part = order_number[6:]  # "0004" kısmını al
        try:
            normalized = f"K-{int(num_part):06d}"  # K-000004 formatına çevir
            search_terms.append(normalized)
        except ValueError:
            pass
    
    # K-XXXXXX formatını KIOSK-XXXX formatına çevir  
    if order_number.upper().startswith("K-"):
        num_part = order_number[2:]  # "000004" kısmını al
        try:
            kiosk_format = f"KIOSK-{int(num_part):04d}"  # KIOSK-0004 formatına çevir
            search_terms.append(kiosk_format)
        except ValueError:
            pass
    
    # Önce queue_number ile ara
    order = await db.kiosk_orders.find_one(
        {"$or": [
            {"queue_number": {"$in": search_terms}},
            {"order_number": {"$in": search_terms}},
            {"id": order_number}
        ]},
        {"_id": 0}
    )
    source = "kiosk"
    
    if not order:
        order = await db.pos_orders.find_one(
            {"$or": [
                {"queue_number": {"$in": search_terms}},
                {"order_number": {"$in": search_terms}},
                {"id": order_number}
            ]},
            {"_id": 0}
        )
        source = "pos"
    
    if not order:
        order = await db.delivery_orders.find_one(
            {"$or": [
                {"queue_number": {"$in": search_terms}},
                {"external_id": order_number},
                {"id": order_number}
            ]},
            {"_id": 0}
        )
        source = "delivery"
    
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    return {
        "id": order.get("id"),
        "order_number": order.get("order_number"),
        "queue_number": order.get("queue_number"),
        "display_code": order.get("queue_number") or order.get("order_number"),
        "status": order.get("status"),
        "source": source,
        "created_at": order.get("created_at"),
        "preparing_at": order.get("preparing_at"),
        "ready_at": order.get("ready_at"),
        "delivered_at": order.get("delivered_at"),
        "items": order.get("items", []),
        "total": order.get("total", 0)
    }


# ==================== TESLİM EDİLDİ & LOGLAMA ====================

@router.put("/orders/{order_id}/delivered")
async def mark_order_delivered(order_id: str, current_user: dict = Depends(get_current_user)):
    """Siparişi teslim edildi olarak işaretle ve logla"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Siparişi bul
    order = await db.kiosk_orders.find_one({"id": order_id}, {"_id": 0})
    source = "kiosk"
    collection = db.kiosk_orders
    
    if not order:
        order = await db.pos_orders.find_one({"id": order_id}, {"_id": 0})
        source = "pos"
        collection = db.pos_orders
    
    if not order:
        order = await db.delivery_orders.find_one({"id": order_id}, {"_id": 0})
        source = "delivery"
        collection = db.delivery_orders
    
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # Kiosk için Türkçe durum
    if source == "kiosk":
        new_status = "Teslim Edildi"
    else:
        new_status = "delivered"
    
    # Siparişi güncelle
    await collection.update_one(
        {"id": order_id},
        {"$set": {
            "status": new_status,
            "delivered_at": now,
            "delivered_by": current_user.get("name") or current_user.get("email"),
            "updated_at": now
        }}
    )
    
    # Teslim loguna kaydet
    delivery_log = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "order_number": order.get("order_number"),
        "queue_number": order.get("queue_number"),
        "source": source,
        "items": order.get("items", []),
        "total": order.get("total", 0),
        "customer_phone": order.get("customer_phone"),
        "delivered_at": now,
        "delivered_by": current_user.get("name") or current_user.get("email"),
        "created_at": order.get("created_at"),
        "preparing_at": order.get("preparing_at"),
        "ready_at": order.get("ready_at"),
        "preparation_time_seconds": None,
        "total_time_seconds": None
    }
    
    # Süre hesapla
    if order.get("created_at") and order.get("ready_at"):
        try:
            created = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00"))
            ready = datetime.fromisoformat(order["ready_at"].replace("Z", "+00:00"))
            delivery_log["preparation_time_seconds"] = (ready - created).total_seconds()
        except:
            pass
    
    if order.get("created_at"):
        try:
            created = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00"))
            delivered = datetime.fromisoformat(now.replace("Z", "+00:00"))
            delivery_log["total_time_seconds"] = (delivered - created).total_seconds()
        except:
            pass
    
    # Log koleksiyonuna kaydet
    await db.delivered_orders_log.insert_one(delivery_log)
    
    return {
        "status": "success",
        "message": "Sipariş teslim edildi olarak işaretlendi",
        "order_id": order_id,
        "delivered_at": now
    }


@router.get("/delivered-log")
async def get_delivered_orders_log(
    date: Optional[str] = None,
    limit: int = Query(default=50, le=500),
    current_user: dict = Depends(get_current_user)
):
    """Teslim edilen siparişlerin logunu getir"""
    db = get_db()
    if db is None:
        return []
    
    query = {}
    
    # Tarih filtresi
    if date:
        # Belirli bir gün için filtrele
        start = f"{date}T00:00:00"
        end = f"{date}T23:59:59"
        query["delivered_at"] = {"$gte": start, "$lte": end}
    
    logs = await db.delivered_orders_log.find(
        query,
        {"_id": 0}
    ).sort("delivered_at", -1).limit(limit).to_list(limit)
    
    return logs


@router.get("/delivered-stats")
async def get_delivered_stats(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Teslim edilen siparişlerin istatistiklerini getir"""
    db = get_db()
    if db is None:
        return {"total_orders": 0, "total_revenue": 0}
    
    # Bugünün tarihi
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    start = f"{date}T00:00:00"
    end = f"{date}T23:59:59"
    
    query = {"delivered_at": {"$gte": start, "$lte": end}}
    
    # Toplam sipariş sayısı
    total_orders = await db.delivered_orders_log.count_documents(query)
    
    # Toplam ciro
    pipeline = [
        {"$match": query},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.delivered_orders_log.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Ortalama hazırlık süresi
    avg_pipeline = [
        {"$match": {**query, "preparation_time_seconds": {"$ne": None}}},
        {"$group": {"_id": None, "avg_prep": {"$avg": "$preparation_time_seconds"}}}
    ]
    avg_result = await db.delivered_orders_log.aggregate(avg_pipeline).to_list(1)
    avg_prep_time = avg_result[0]["avg_prep"] if avg_result else 0
    
    return {
        "date": date,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "avg_preparation_time_seconds": round(avg_prep_time, 0) if avg_prep_time else 0,
        "avg_preparation_time_minutes": round(avg_prep_time / 60, 1) if avg_prep_time else 0
    }

