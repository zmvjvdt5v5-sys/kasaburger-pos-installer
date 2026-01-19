"""Kiosk Combo & Promosyon Router"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/kiosk", tags=["Kiosk Promotions"])


# ==================== PYDANTIC MODELS ====================

class KioskCombo(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    products: List[str]
    original_price: float = 0
    combo_price: float
    discount_percent: Optional[float] = None
    image: Optional[str] = None
    is_active: bool = True
    start_hour: Optional[int] = None
    end_hour: Optional[int] = None
    gift_product_id: Optional[str] = None
    gift_product_name: Optional[str] = None
    gift_message: Optional[str] = None


class KioskPromotion(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    discount_type: str = "percent"
    discount_value: float = 0
    min_order_amount: Optional[float] = None
    applicable_categories: Optional[List[str]] = None
    applicable_products: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_hour: Optional[int] = None
    end_hour: Optional[int] = None
    is_active: bool = True
    banner_color: str = "#FF6B00"


# ==================== DEFAULT DATA ====================

DEFAULT_COMBOS = [
    {
        "id": "klasik-menu", "name": "Klasik Menü", "description": "Kasa Classic + Patates + İçecek",
        "products": ["kasa-classic", "cheese-fries", "pepsi"], "original_price": 655, "combo_price": 550,
        "discount_percent": 16, "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg"
    },
    {
        "id": "premium-menu", "name": "Premium Menü", "description": "Viking Burger + Truffle Fries + Milkshake",
        "products": ["viking-burger", "truffle-fries", "milkshake"], "original_price": 690, "combo_price": 590,
        "discount_percent": 15, "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719764/kasaburger/products/fojwkaq08bwngprupkgt.jpg",
        "gift_product_id": "mozarella-sticks", "gift_product_name": "Mozarella Sticks", "gift_message": "🎁 Mozzarella Sticks Hediye!"
    },
    {
        "id": "tavuk-menu", "name": "Tavuk Menü", "description": "Crispy Chicken + Soğan Halkası + Ayran",
        "products": ["crispy-chicken", "sogan-halkasi", "ayran"], "original_price": 575, "combo_price": 480,
        "discount_percent": 17, "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719954/kasaburger/products/xobrshlgrwd4opojrmum.jpg"
    },
    {
        "id": "double-menu", "name": "Double XL Menü", "description": "Kasa Double XL + Cheese Fries + Pepsi",
        "products": ["kasa-double-xl", "cheese-fries", "pepsi"], "original_price": 835, "combo_price": 720,
        "discount_percent": 14, "is_active": True, "start_hour": 11, "end_hour": 15,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719837/kasaburger/products/e5erpcna8ufgyl4roxhh.jpg",
        "gift_product_id": "mac-cheese", "gift_product_name": "Mac and Cheese Topları", "gift_message": "🎁 Mac & Cheese Hediye!"
    }
]

DEFAULT_PROMOTIONS = [
    {
        "id": "happy-hour", "title": "Happy Hour! 🎉", "description": "14:00-17:00 arası tüm burgerlerde %10 indirim",
        "discount_type": "percent", "discount_value": 10, "applicable_categories": ["Et Burger", "Premium", "Tavuk"],
        "start_hour": 14, "end_hour": 17, "is_active": True, "banner_color": "#FF6B00"
    },
    {
        "id": "hafta-sonu", "title": "Hafta Sonu Fırsatı 🔥", "description": "200₺ üzeri siparişlerde 30₺ indirim",
        "discount_type": "fixed", "discount_value": 30, "min_order_amount": 200, "is_active": True, "banner_color": "#E63946"
    }
]


# ==================== HELPER ====================

async def _update_kiosk_version(db):
    if db is not None:
        await db.kiosk_meta.update_one(
            {"key": "version"},
            {"$set": {"value": datetime.now(timezone.utc).isoformat()}, "$inc": {"counter": 1}},
            upsert=True
        )


# ==================== COMBO ENDPOINTS ====================

@router.get("/combos")
async def get_kiosk_combos():
    db = get_db()
    if db is None:
        return DEFAULT_COMBOS
    
    combos = await db.kiosk_combos.find({"is_active": True}, {"_id": 0}).to_list(50)
    if not combos:
        for combo in DEFAULT_COMBOS:
            existing = await db.kiosk_combos.find_one({"id": combo["id"]})
            if not existing:
                await db.kiosk_combos.insert_one({**combo})
        combos = await db.kiosk_combos.find({"is_active": True}, {"_id": 0}).to_list(50)
    
    current_hour = datetime.now(timezone.utc).hour
    filtered = []
    for combo in combos:
        start, end = combo.get("start_hour"), combo.get("end_hour")
        if start is None or end is None:
            filtered.append(combo)
        elif start <= current_hour < end:
            filtered.append(combo)
    return filtered


@router.get("/combos/all")
async def get_all_kiosk_combos(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return DEFAULT_COMBOS
    
    combos = await db.kiosk_combos.find({}, {"_id": 0}).to_list(100)
    if not combos:
        for combo in DEFAULT_COMBOS:
            existing = await db.kiosk_combos.find_one({"id": combo["id"]})
            if not existing:
                await db.kiosk_combos.insert_one({**combo})
        combos = await db.kiosk_combos.find({}, {"_id": 0}).to_list(100)
    return combos


@router.post("/combos")
async def create_kiosk_combo(combo: KioskCombo, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    combo_doc = {"id": str(uuid.uuid4())[:8], **combo.model_dump(exclude={"id"}), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.kiosk_combos.insert_one(combo_doc)
    combo_doc.pop("_id", None)
    await _update_kiosk_version(db)
    return combo_doc


@router.put("/combos/{combo_id}")
async def update_kiosk_combo(combo_id: str, combo: KioskCombo, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    update_data = combo.model_dump(exclude={"id"})
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.kiosk_combos.update_one({"id": combo_id}, {"$set": update_data})
    await _update_kiosk_version(db)
    return {"status": "success"}


@router.delete("/combos/{combo_id}")
async def delete_kiosk_combo(combo_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_combos.delete_one({"id": combo_id})
    await _update_kiosk_version(db)
    return {"status": "deleted"}


# ==================== PROMOTION ENDPOINTS ====================

@router.get("/promotions")
async def get_kiosk_promotions():
    db = get_db()
    if db is None:
        return DEFAULT_PROMOTIONS
    
    promotions = await db.kiosk_promotions.find({"is_active": True}, {"_id": 0}).to_list(50)
    if not promotions:
        for promo in DEFAULT_PROMOTIONS:
            existing = await db.kiosk_promotions.find_one({"id": promo["id"]})
            if not existing:
                await db.kiosk_promotions.insert_one({**promo})
        promotions = await db.kiosk_promotions.find({"is_active": True}, {"_id": 0}).to_list(50)
    
    current_hour = datetime.now(timezone.utc).hour
    filtered = []
    for promo in promotions:
        start, end = promo.get("start_hour"), promo.get("end_hour")
        if start is None or end is None:
            filtered.append(promo)
        elif start <= current_hour < end:
            filtered.append(promo)
    return filtered


@router.get("/promotions/all")
async def get_all_kiosk_promotions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return DEFAULT_PROMOTIONS
    
    promotions = await db.kiosk_promotions.find({}, {"_id": 0}).to_list(100)
    if not promotions:
        for promo in DEFAULT_PROMOTIONS:
            existing = await db.kiosk_promotions.find_one({"id": promo["id"]})
            if not existing:
                await db.kiosk_promotions.insert_one({**promo})
        promotions = await db.kiosk_promotions.find({}, {"_id": 0}).to_list(100)
    return promotions


@router.post("/promotions")
async def create_kiosk_promotion(promo: KioskPromotion, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    promo_doc = {"id": str(uuid.uuid4())[:8], **promo.model_dump(exclude={"id"}), "created_at": datetime.now(timezone.utc).isoformat()}
    await db.kiosk_promotions.insert_one(promo_doc)
    promo_doc.pop("_id", None)
    await _update_kiosk_version(db)
    return promo_doc


@router.put("/promotions/{promo_id}")
async def update_kiosk_promotion(promo_id: str, promo: KioskPromotion, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    update_data = promo.model_dump(exclude={"id"})
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.kiosk_promotions.update_one({"id": promo_id}, {"$set": update_data})
    await _update_kiosk_version(db)
    return {"status": "success"}


@router.delete("/promotions/{promo_id}")
async def delete_kiosk_promotion(promo_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_promotions.delete_one({"id": promo_id})
    await _update_kiosk_version(db)
    return {"status": "deleted"}
