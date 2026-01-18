"""Kiosk Router - Self-Servis Kiosk"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/kiosk", tags=["Kiosk"])

# Varsayılan Kiosk Ürünleri - Doğru fiyatlar ve Cloudinary görselleri
DEFAULT_KIOSK_PRODUCTS = [
    # ET BURGER
    {"id": "kasa-classic", "name": "Kasa Classic Burger", "category": "Et Burger", "price": 460, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg", "available": True, "description": "150 gr. özel baharatlı dana köfte, taze yeşillik, Kasa Gizli Sos"},
    {"id": "golden-burger", "name": "Golden Burger", "category": "Et Burger", "price": 1190, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719644/kasaburger/products/etnwv98b4qqa3dhs7j5w.jpg", "available": True, "is_premium": True, "description": "150 gr. Dry-Aged köfte, brioche ekmek, yenilebilir altın kaplama, trüf sos, double cheddar"},
    {"id": "cheese-lover", "name": "Cheese Lover Burger", "category": "Et Burger", "price": 560, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719667/kasaburger/products/c2kdofwltpm4xsrcheuu.jpg", "available": True, "description": "150 gr. dana köfte, çift cheddar + erimiş peynir sosu, karamelize soğan"},
    {"id": "no7-burger", "name": "No:7 Burger", "category": "Et Burger", "price": 540, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719690/kasaburger/products/dvqjrymmcqtfjxiuc29z.jpg", "available": True, "description": "150 gr. dana köfte, double cheddar, jalapeno, acılı kasa sos, çıtır soğan"},
    {"id": "hirsiz-polis", "name": "Hırsız & Polis Burger", "category": "Et Burger", "price": 490, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719731/kasaburger/products/zo9ysvxshviqu7pbqztq.jpg", "available": True, "description": "2x150 gr. dana köfte, Polis sos (tatlı), Hırsız (acı), cheddar"},
    # PREMIUM GOURMET
    {"id": "viking-burger", "name": "Viking Burger", "category": "Premium", "price": 430, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719764/kasaburger/products/fojwkaq08bwngprupkgt.jpg", "available": True, "is_premium": True, "description": "150 gr. dana köfte, 20 gr. cheddar peyniri, çıtır soğan, viking sos"},
    {"id": "milano-burger", "name": "Milano Burger", "category": "Premium", "price": 440, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719790/kasaburger/products/oybw8jxjs53wleejjeen.jpg", "available": True, "is_premium": True, "description": "150gr. dana köfte, mozzarella, kuru domates, pesto mayo, roka"},
    {"id": "kasa-double-xl", "name": "Kasa Double XL", "category": "Premium", "price": 640, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719837/kasaburger/products/e5erpcna8ufgyl4roxhh.jpg", "available": True, "is_premium": True, "description": "300 gr. dana köfte, 40 gr. cheddar, karamelize soğan, kasa özel sos"},
    {"id": "smoky-bbq", "name": "Smoky BBQ Burger", "category": "Premium", "price": 560, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719856/kasaburger/products/zx1kw1d23traidkigrdv.jpg", "available": True, "is_premium": True, "description": "150 gr. dana köfte, 20 gr. cheddar, kızartılmış pastırma, bbq sos"},
    {"id": "animal-style", "name": "Animal Style Burger", "category": "Premium", "price": 550, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719882/kasaburger/products/sdgw0vm1iicwkjvvkeee.jpg", "available": True, "is_premium": True, "description": "150 gr. dana köfte, cheddar peynir, karamelize soğan, animal sos"},
    # TAVUK BURGER
    {"id": "crispy-chicken", "name": "Crispy Chicken Burger", "category": "Tavuk", "price": 360, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719954/kasaburger/products/xobrshlgrwd4opojrmum.jpg", "available": True, "description": "Çıtır paneli tavuk göğsü, taze yeşillik, turşu, mayonez"},
    {"id": "double-crispy", "name": "Double Crispy Chicken", "category": "Tavuk", "price": 410, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719978/kasaburger/products/ronl4qic10vbgjictclt.jpg", "available": True, "description": "Double tavuk, cheddar, taze yeşillik, acılı kasa sos, turşu"},
    {"id": "animal-chicken", "name": "Animal Style Chicken", "category": "Tavuk", "price": 430, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720009/kasaburger/products/lpmkvz6bhfewl5pgskic.jpg", "available": True, "description": "Çıtır paneli tavuk göğsü, karamelize soğan, double cheddar, animal sos"},
    {"id": "spicy-hirsiz", "name": "(Spicy) Hırsız Burger", "category": "Tavuk", "price": 420, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720039/kasaburger/products/bvxcrizznvjaqjvxlucu.jpg", "available": True, "description": "Acı marinasyonlu çıtır tavuk, cheddar, acılı kasa mayonez, jalapeno"},
    {"id": "sweet-polis", "name": "(Sweet) Polis Burger", "category": "Tavuk", "price": 420, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720071/kasaburger/products/w50qmsz041zi7h4pjkwu.jpg", "available": True, "description": "Tatlı marinasyonlu çıtır tavuk, tatlı kasa sos, taze yeşillik, mozzarella"},
    {"id": "milano-chicken", "name": "Milano Chicken Burger", "category": "Tavuk", "price": 440, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720100/kasaburger/products/tfrehnmtr9juqankalhj.jpg", "available": True, "description": "İnce paneli çıtır tavuk, pesto mayo, kurutulmuş domates, mozzarella"},
    {"id": "viking-chicken", "name": "Viking Chicken Burger", "category": "Tavuk", "price": 430, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720128/kasaburger/products/qwg6eqpyimd8dpn9nr1v.jpg", "available": True, "description": "Viking sos, çıtır tavuk, cheddar, kornişon turşu, çıtır soğan"},
    # YAN ÜRÜNLER
    {"id": "mac-cheese", "name": "Mac and Cheese Topları", "category": "Yan Ürün", "price": 170, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720160/kasaburger/products/jnzrcojxzkdrgb5u2exk.jpg", "available": True},
    {"id": "mozarella-sticks", "name": "Mozarella Sticks", "category": "Yan Ürün", "price": 210, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720187/kasaburger/products/kvsrbiutiqdqhoolov8z.jpg", "available": True, "description": "6 adet (yarım porsiyon patates ile)"},
    {"id": "sogan-halkasi", "name": "Soğan Halkası", "category": "Yan Ürün", "price": 180, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720212/kasaburger/products/ujatmwdny3it8dzcikkn.jpg", "available": True, "description": "8 adet (yarım porsiyon patates ile)"},
    {"id": "cheese-fries", "name": "Prison Cheese Lover Fries", "category": "Yan Ürün", "price": 150, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720240/kasaburger/products/dzxb0lv41xafeybynhri.jpg", "available": True, "description": "Cheddar soslu patates"},
    {"id": "truffle-fries", "name": "Prison Truffle Fries", "category": "Yan Ürün", "price": 175, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720258/kasaburger/products/cj3px5epr92okzergc7c.jpg", "available": True, "description": "Trüf soslu patates"},
    {"id": "cajun-fries", "name": "Prison Hot Lockdown Fries", "category": "Yan Ürün", "price": 160, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720282/kasaburger/products/csdwzqwozldfxxt7pkpr.jpg", "available": True, "description": "Cajun baharatlı patates"},
    # İÇECEKLER
    {"id": "ayran", "name": "Ayran", "category": "İçecek", "price": 35, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720311/kasaburger/products/xgrn8fvph9jaeh1bqwat.jpg", "available": True},
    {"id": "su", "name": "Su", "category": "İçecek", "price": 20, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720333/kasaburger/products/jl2q8smtq7de6lh16uul.jpg", "available": True},
    {"id": "limonata", "name": "Limonata", "category": "İçecek", "price": 55, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720355/kasaburger/products/exyjmazfyp4hyx2hbxsu.jpg", "available": True},
    {"id": "pepsi", "name": "Pepsi", "category": "İçecek", "price": 45, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720380/kasaburger/products/zu98squbgxxa0hppmxwn.jpg", "available": True},
    {"id": "milkshake", "name": "Milkshake", "category": "İçecek", "price": 85, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720424/kasaburger/products/uitufnzpxr7fatrttobr.jpg", "available": True},
    # TATLILAR
    {"id": "choco-bomb", "name": "Kasa Choco Bomb", "category": "Tatlı", "price": 200, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768687930/kasaburger/products/ohr3dgedrnaz53p8p26t.jpg", "available": True},
    {"id": "churros", "name": "Churros", "category": "Tatlı", "price": 180, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686916/kasaburger/products/yveoyknzrq0w0kuwxxvq.jpg", "available": True},
    {"id": "oreo-dream", "name": "Oreo Dream Cup", "category": "Tatlı", "price": 220, "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686685/kasaburger/products/ktej7vqaqnm2qt5fjnce.jpg", "available": True},
]

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


@router.post("/products/seed")
async def seed_kiosk_products(current_user: dict = Depends(get_current_user)):
    """Varsayılan kiosk ürünlerini yükle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Mevcut ürünleri sil
    await db.kiosk_products.delete_many({})
    
    # Varsayılan ürünleri ekle
    for product in DEFAULT_KIOSK_PRODUCTS:
        product_doc = {**product, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.kiosk_products.insert_one(product_doc)
    
    return {"status": "success", "count": len(DEFAULT_KIOSK_PRODUCTS)}


@router.post("/products/reset")
async def reset_kiosk_products(current_user: dict = Depends(get_current_user)):
    """Kiosk ürünlerini sıfırla ve varsayılanları yükle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_products.delete_many({})
    
    for product in DEFAULT_KIOSK_PRODUCTS:
        product_doc = {**product, "created_at": datetime.now(timezone.utc).isoformat()}
        await db.kiosk_products.insert_one(product_doc)
    
    return {"status": "success", "message": "Ürünler sıfırlandı", "count": len(DEFAULT_KIOSK_PRODUCTS)}


@router.get("/products")
async def get_kiosk_products():
    db = get_db()
    if db is None:
        return DEFAULT_KIOSK_PRODUCTS
    products = await db.kiosk_products.find({}, {"_id": 0}).to_list(100)
    if not products:
        # Ürün yoksa varsayılanları döndür
        return DEFAULT_KIOSK_PRODUCTS
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
