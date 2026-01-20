"""Orders Router - Bayi Siparişleri"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user, get_current_dealer
from utils.database import get_db
from utils.bizimhesap import send_invoice_to_bizimhesap

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
    if db is None:
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
    if db is None:
        return []
    
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [OrderResponse(**o) for o in orders]

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return OrderResponse(**order)

@router.put("/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status: str, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Mevcut siparişi al
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    update_data = {
        "status": status, 
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    bizimhesap_result = None
    
    # Sipariş onaylandığında (pending_approval -> confirmed)
    if status == "confirmed" and order.get("status") == "pending_approval":
        update_data["approved_at"] = datetime.now(timezone.utc).isoformat()
        update_data["approved_by"] = current_user.get("email") or current_user.get("name")
        
        # Bayi siparişi ise fatura oluştur ve BizimHesap'a gönder
        if order.get("source") == "dealer_portal" and order.get("dealer_id"):
            invoice_id = str(uuid.uuid4())
            invoice_number = f"FTR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{invoice_id[:6].upper()}"
            
            invoice_doc = {
                "id": invoice_id,
                "invoice_number": invoice_number,
                "order_id": order_id,
                "order_number": order.get("order_number"),
                "dealer_id": order.get("dealer_id"),
                "dealer_name": order.get("dealer_name"),
                "items": order.get("items", []),
                "subtotal": order.get("subtotal", 0),
                "tax_amount": order.get("tax_amount", 0),
                "total": order.get("total", 0),
                "status": "pending",
                "bizimhesap_status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "due_date": order.get("delivery_date")
            }
            await db.invoices.insert_one(invoice_doc)
            
            # Bayi bakiyesini güncelle
            await db.dealers.update_one(
                {"id": order.get("dealer_id")},
                {"$inc": {"balance": order.get("total", 0), "current_balance": order.get("total", 0)}}
            )
            
            update_data["invoice_id"] = invoice_id
            update_data["invoice_number"] = invoice_number
            
            # Bayi bilgilerini al
            dealer = await db.dealers.find_one({"id": order.get("dealer_id")}, {"_id": 0})
            
            # BizimHesap'a fatura gönder
            bizimhesap_result = await send_invoice_to_bizimhesap(invoice_doc, order, dealer)
            
            # Fatura durumunu güncelle
            if bizimhesap_result.get("status") == "success":
                await db.invoices.update_one(
                    {"id": invoice_id},
                    {"$set": {
                        "bizimhesap_guid": bizimhesap_result.get("guid"),
                        "bizimhesap_url": bizimhesap_result.get("url", ""),
                        "bizimhesap_status": "sent",
                        "status": "sent"
                    }}
                )
            else:
                await db.invoices.update_one(
                    {"id": invoice_id},
                    {"$set": {
                        "bizimhesap_status": "error",
                        "bizimhesap_error": bizimhesap_result.get("message", "Bilinmeyen hata")
                    }}
                )
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    response = {"status": "updated", "new_status": status}
    
    # BizimHesap sonucunu ekle
    if bizimhesap_result:
        response["bizimhesap"] = bizimhesap_result
        if bizimhesap_result.get("status") == "success":
            response["invoice_number"] = update_data.get("invoice_number")
            response["message"] = "Sipariş onaylandı ve fatura BizimHesap'a gönderildi"
        else:
            response["warning"] = f"Sipariş onaylandı ancak BizimHesap'a gönderilemedi: {bizimhesap_result.get('message')}"
    
    return response

@router.delete("/{order_id}")
async def delete_order(order_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return {"status": "deleted"}

# Bayi Siparişleri
@router.post("/dealer", response_model=OrderResponse)
async def create_dealer_order(order: OrderCreate, current_dealer: dict = Depends(get_current_dealer)):
    db = get_db()
    if db is None:
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
    if db is None:
        return []
    
    dealer = await db.dealers.find_one(
        {"$or": [{"id": current_dealer.get("user_id")}, {"code": current_dealer.get("email")}]},
        {"_id": 0}
    )
    
    dealer_id = dealer.get("id") if dealer else current_dealer.get("user_id")
    orders = await db.orders.find({"dealer_id": dealer_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [OrderResponse(**o) for o in orders]
