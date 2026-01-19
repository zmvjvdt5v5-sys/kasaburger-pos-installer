"""Kiosk Router - Self-Servis Kiosk"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/kiosk", tags=["Kiosk"])


# ==================== PYDANTIC MODELS ====================

class KioskCategory(BaseModel):
    id: Optional[str] = None
    name: str
    icon: str = "📦"
    order: int = 0
    is_active: bool = True


class CategoryReorderRequest(BaseModel):
    category_ids: List[str]


class KioskProduct(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    price: float
    image: Optional[str] = None
    description: Optional[str] = None
    available: bool = True
    is_premium: bool = False
    order: int = 0


# ==================== DEFAULT DATA ====================

DEFAULT_KIOSK_CATEGORIES = [
    {"id": "et-burger", "name": "Et Burger", "icon": "🍔", "order": 1, "is_active": True},
    {"id": "premium", "name": "Premium", "icon": "👑", "order": 2, "is_active": True},
    {"id": "tavuk", "name": "Tavuk", "icon": "🍗", "order": 3, "is_active": True},
    {"id": "yan-urun", "name": "Yan Ürün", "icon": "🍟", "order": 4, "is_active": True},
    {"id": "icecek", "name": "İçecek", "icon": "🥤", "order": 5, "is_active": True},
    {"id": "tatli", "name": "Tatlı", "icon": "🍫", "order": 6, "is_active": True},
]

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

class KioskOrder(BaseModel):
    items: List[dict]
    total: float
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None


class KioskCombo(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    products: List[str]  # product IDs
    original_price: float = 0
    combo_price: float
    discount_percent: Optional[float] = None
    image: Optional[str] = None
    is_active: bool = True
    start_hour: Optional[int] = None  # 0-23, None = her zaman
    end_hour: Optional[int] = None
    # Hediye ürün özellikleri
    gift_product_id: Optional[str] = None  # Hediye ürün ID'si
    gift_product_name: Optional[str] = None  # Hediye ürün adı (cache)
    gift_message: Optional[str] = None  # "Nugget Hediye!" gibi mesaj


class KioskPromotion(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    discount_type: str = "percent"  # percent, fixed, combo
    discount_value: float = 0
    min_order_amount: Optional[float] = None
    applicable_categories: Optional[List[str]] = None
    applicable_products: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_hour: Optional[int] = None  # 0-23
    end_hour: Optional[int] = None
    is_active: bool = True
    banner_color: str = "#FF6B00"


# ==================== SADAKAT PROGRAMI MODELLERİ ====================

class LoyaltyMember(BaseModel):
    id: Optional[str] = None
    phone: str  # Telefon numarası (benzersiz)
    name: Optional[str] = None
    total_points: int = 0
    total_orders: int = 0
    total_spent: float = 0
    tier: str = "bronze"  # bronze, silver, gold, platinum
    qr_code: Optional[str] = None
    created_at: Optional[str] = None
    last_order_at: Optional[str] = None


class LoyaltyReward(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    points_required: int
    reward_type: str = "free_product"  # free_product, discount_percent, discount_fixed
    reward_value: Optional[str] = None  # product_id veya indirim değeri
    is_active: bool = True
    image: Optional[str] = None


class LoyaltyTransaction(BaseModel):
    member_id: str
    order_id: Optional[str] = None
    points: int
    transaction_type: str  # earn, redeem
    description: str


# Sadakat Programı Ayarları
LOYALTY_CONFIG = {
    "points_per_lira": 1,  # Her 1 TL = 1 puan
    "tiers": {
        "bronze": {"min_points": 0, "bonus_multiplier": 1.0, "name": "Bronz", "icon": "🥉"},
        "silver": {"min_points": 500, "bonus_multiplier": 1.25, "name": "Gümüş", "icon": "🥈"},
        "gold": {"min_points": 1500, "bonus_multiplier": 1.5, "name": "Altın", "icon": "🥇"},
        "platinum": {"min_points": 5000, "bonus_multiplier": 2.0, "name": "Platin", "icon": "💎"}
    }
}

DEFAULT_REWARDS = [
    {
        "id": "free-drink",
        "name": "Ücretsiz İçecek",
        "description": "Ayran, Su veya Pepsi",
        "points_required": 100,
        "reward_type": "free_product",
        "reward_value": "pepsi",
        "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720380/kasaburger/products/zu98squbgxxa0hppmxwn.jpg"
    },
    {
        "id": "free-fries",
        "name": "Ücretsiz Patates",
        "description": "Cheese Fries veya Cajun Fries",
        "points_required": 200,
        "reward_type": "free_product",
        "reward_value": "cheese-fries",
        "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720240/kasaburger/products/dzxb0lv41xafeybynhri.jpg"
    },
    {
        "id": "free-dessert",
        "name": "Ücretsiz Tatlı",
        "description": "Churros veya Oreo Dream",
        "points_required": 300,
        "reward_type": "free_product",
        "reward_value": "churros",
        "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686916/kasaburger/products/yveoyknzrq0w0kuwxxvq.jpg"
    },
    {
        "id": "free-burger",
        "name": "Ücretsiz Burger",
        "description": "Kasa Classic Burger",
        "points_required": 500,
        "reward_type": "free_product",
        "reward_value": "kasa-classic",
        "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg"
    },
    {
        "id": "discount-10",
        "name": "%10 İndirim",
        "description": "Sonraki siparişte %10 indirim",
        "points_required": 150,
        "reward_type": "discount_percent",
        "reward_value": "10",
        "is_active": True
    },
    {
        "id": "discount-50tl",
        "name": "50₺ İndirim",
        "description": "Sonraki siparişte 50₺ indirim",
        "points_required": 400,
        "reward_type": "discount_fixed",
        "reward_value": "50",
        "is_active": True
    }
]


# ==================== KATEGORİ YÖNETİMİ ====================

@router.get("/categories")
async def get_kiosk_categories():
    """Kiosk kategorilerini getir"""
    db = get_db()
    if db is None:
        return DEFAULT_KIOSK_CATEGORIES
    
    categories = await db.kiosk_categories.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    if not categories:
        # Varsayılan kategorileri yükle
        for cat in DEFAULT_KIOSK_CATEGORIES:
            await db.kiosk_categories.insert_one(cat)
        return DEFAULT_KIOSK_CATEGORIES
    
    return categories


@router.post("/categories")
async def create_kiosk_category(category: KioskCategory, current_user: dict = Depends(get_current_user)):
    """Yeni kategori oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # En yüksek order'ı bul
    last_cat = await db.kiosk_categories.find_one(sort=[("order", -1)])
    next_order = (last_cat.get("order", 0) + 1) if last_cat else 1
    
    cat_doc = {
        "id": str(uuid.uuid4())[:8],
        "name": category.name,
        "icon": category.icon,
        "order": category.order or next_order,
        "is_active": category.is_active,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.kiosk_categories.insert_one(cat_doc)
    cat_doc.pop("_id", None)
    
    # Versiyon güncelle
    await _update_kiosk_version(db)
    
    return cat_doc


@router.put("/categories/reorder")
async def reorder_kiosk_categories(request: CategoryReorderRequest, current_user: dict = Depends(get_current_user)):
    """Kategorileri yeniden sırala"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    for idx, cat_id in enumerate(request.category_ids):
        await db.kiosk_categories.update_one(
            {"id": cat_id},
            {"$set": {"order": idx + 1}}
        )
    
    # Versiyon güncelle
    await _update_kiosk_version(db)
    
    return {"status": "success", "order": request.category_ids}


@router.put("/categories/{category_id}")
async def update_kiosk_category(category_id: str, category: KioskCategory, current_user: dict = Depends(get_current_user)):
    """Kategori güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    update_data = {
        "name": category.name,
        "icon": category.icon,
        "order": category.order,
        "is_active": category.is_active,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Eski kategori adını bul
    old_cat = await db.kiosk_categories.find_one({"id": category_id}, {"_id": 0})
    old_name = old_cat.get("name") if old_cat else None
    
    await db.kiosk_categories.update_one({"id": category_id}, {"$set": update_data})
    
    # Eğer kategori adı değiştiyse, ürünlerin kategorisini de güncelle
    if old_name and old_name != category.name:
        await db.kiosk_products.update_many(
            {"category": old_name},
            {"$set": {"category": category.name}}
        )
    
    # Versiyon güncelle
    await _update_kiosk_version(db)
    
    return {"status": "success", "old_name": old_name, "new_name": category.name}


@router.delete("/categories/{category_id}")
async def delete_kiosk_category(category_id: str, current_user: dict = Depends(get_current_user)):
    """Kategori sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Kategoriyi bul
    cat = await db.kiosk_categories.find_one({"id": category_id}, {"_id": 0})
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    # Bu kategorideki ürünleri kontrol et
    products_count = await db.kiosk_products.count_documents({"category": cat.get("name")})
    if products_count > 0:
        raise HTTPException(status_code=400, detail=f"Bu kategoride {products_count} ürün var. Önce ürünleri taşıyın.")
    
    await db.kiosk_categories.delete_one({"id": category_id})
    
    # Versiyon güncelle
    await _update_kiosk_version(db)
    
    return {"status": "deleted"}


# ==================== ÜRÜN SIRALAMA ====================

@router.put("/products/reorder")
async def reorder_kiosk_products(product_orders: List[dict], current_user: dict = Depends(get_current_user)):
    """Ürünleri yeniden sırala. Format: [{"id": "xxx", "order": 1}, ...]"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    for item in product_orders:
        await db.kiosk_products.update_one(
            {"id": item.get("id")},
            {"$set": {"order": item.get("order", 0)}}
        )
    
    # Versiyon güncelle
    await _update_kiosk_version(db)
    
    return {"status": "success"}


# ==================== YARDIMCI FONKSİYONLAR ====================

async def _update_kiosk_version(db):
    """Kiosk versiyon numarasını güncelle"""
    await db.kiosk_settings.update_one(
        {"key": "products_version"},
        {"$set": {"value": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )


# ==================== ÜRÜN YÖNETİMİ ====================


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


@router.delete("/products/cleanup-test")
async def cleanup_test_products(current_user: dict = Depends(get_current_user)):
    """Test ürünlerini temizle (TEST_ ile başlayan veya id=None olanlar)"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Test ürünlerini sil (TEST_ içeren veya id=None olanlar)
    result1 = await db.kiosk_products.delete_many({"name": {"$regex": "TEST", "$options": "i"}})
    result2 = await db.kiosk_products.delete_many({"id": None})
    result3 = await db.kiosk_products.delete_many({"id": {"$exists": False}})
    
    total_deleted = result1.deleted_count + result2.deleted_count + result3.deleted_count
    
    # Versiyon güncelle
    await _update_kiosk_version(db)
    
    return {"status": "cleaned", "deleted_count": total_deleted}


@router.post("/products")
async def create_kiosk_product(product: KioskProduct, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    product_data = product.model_dump(exclude={"id"})  # Exclude id from input
    product_doc = {
        "id": str(uuid.uuid4()),
        **product_data,
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
    
    update_data = product.model_dump(exclude={"id"})  # Exclude id to preserve original
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.kiosk_products.update_one({"id": product_id}, {"$set": update_data})
    updated = await db.kiosk_products.find_one({"id": product_id}, {"_id": 0})
    
    # Versiyon numarasını güncelle (cache invalidation için)
    await db.kiosk_settings.update_one(
        {"key": "products_version"},
        {"$set": {"value": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return updated

@router.delete("/products/{product_id}")
async def delete_kiosk_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_products.delete_one({"id": product_id})
    
    # Versiyon numarasını güncelle
    await db.kiosk_settings.update_one(
        {"key": "products_version"},
        {"$set": {"value": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"status": "deleted"}


@router.get("/products/version")
async def get_kiosk_products_version():
    """Kiosk ürünlerinin versiyon numarasını döndür (cache invalidation için)"""
    db = get_db()
    if db is None:
        return {"version": "default"}
    
    version_doc = await db.kiosk_settings.find_one({"key": "products_version"}, {"_id": 0})
    return {"version": version_doc.get("value") if version_doc else "default"}


@router.post("/products/bulk-update")
async def bulk_update_kiosk_products(products: List[KioskProduct], current_user: dict = Depends(get_current_user)):
    """Tüm kiosk ürünlerini toplu güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Mevcut ürünleri sil
    await db.kiosk_products.delete_many({})
    
    # Yeni ürünleri ekle
    now = datetime.now(timezone.utc).isoformat()
    for idx, product in enumerate(products):
        product_doc = {
            "id": f"kiosk-{idx+1}",
            **product.model_dump(),
            "created_at": now
        }
        await db.kiosk_products.insert_one(product_doc)
    
    # Versiyon güncelle
    await db.kiosk_settings.update_one(
        {"key": "products_version"},
        {"$set": {"value": now}},
        upsert=True
    )
    
    return {"status": "success", "count": len(products), "version": now}

@router.post("/orders")
async def create_kiosk_order(order: KioskOrder):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    order_count = await db.kiosk_orders.count_documents({})
    
    # Queue number (günlük sıfırlanan sıra numarası) oluştur
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    counter = await db.queue_counters.find_one({"prefix": "PKT", "date": today}, {"_id": 0})
    new_count = (counter.get("count", 0) if counter else 0) + 1
    await db.queue_counters.update_one(
        {"prefix": "PKT", "date": today},
        {"$set": {"count": new_count, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    queue_number = f"PKT-{str(new_count).zfill(4)}"
    
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_number": f"K-{str(order_count + 1).zfill(6)}",
        "queue_number": queue_number,
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



# ==================== COMBO MENÜ YÖNETİMİ ====================

DEFAULT_COMBOS = [
    {
        "id": "klasik-menu",
        "name": "Klasik Menü",
        "description": "Kasa Classic + Patates + İçecek",
        "products": ["kasa-classic", "cheese-fries", "pepsi"],
        "original_price": 655,
        "combo_price": 550,
        "discount_percent": 16,
        "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg"
    },
    {
        "id": "premium-menu",
        "name": "Premium Menü",
        "description": "Viking Burger + Truffle Fries + Milkshake",
        "products": ["viking-burger", "truffle-fries", "milkshake"],
        "original_price": 690,
        "combo_price": 590,
        "discount_percent": 15,
        "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719764/kasaburger/products/fojwkaq08bwngprupkgt.jpg",
        "gift_product_id": "mozarella-sticks",
        "gift_product_name": "Mozarella Sticks",
        "gift_message": "🎁 Mozzarella Sticks Hediye!"
    },
    {
        "id": "tavuk-menu",
        "name": "Tavuk Menü",
        "description": "Crispy Chicken + Soğan Halkası + Ayran",
        "products": ["crispy-chicken", "sogan-halkasi", "ayran"],
        "original_price": 575,
        "combo_price": 480,
        "discount_percent": 17,
        "is_active": True,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719954/kasaburger/products/xobrshlgrwd4opojrmum.jpg"
    },
    {
        "id": "double-menu",
        "name": "Double XL Menü",
        "description": "Kasa Double XL + Cheese Fries + Pepsi",
        "products": ["kasa-double-xl", "cheese-fries", "pepsi"],
        "original_price": 835,
        "combo_price": 720,
        "discount_percent": 14,
        "is_active": True,
        "start_hour": 11,
        "end_hour": 15,
        "image": "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719837/kasaburger/products/e5erpcna8ufgyl4roxhh.jpg",
        "gift_product_id": "mac-cheese",
        "gift_product_name": "Mac and Cheese Topları",
        "gift_message": "🎁 Mac & Cheese Hediye!"
    }
]


@router.get("/combos")
async def get_kiosk_combos():
    """Kiosk combo menülerini getir (aktif olanlar, saat filtreli)"""
    db = get_db()
    if db is None:
        return DEFAULT_COMBOS
    
    combos = await db.kiosk_combos.find({"is_active": True}, {"_id": 0}).to_list(50)
    if not combos:
        # Varsayılan comboları yükle
        for combo in DEFAULT_COMBOS:
            existing = await db.kiosk_combos.find_one({"id": combo["id"]})
            if not existing:
                await db.kiosk_combos.insert_one({**combo})
        combos = await db.kiosk_combos.find({"is_active": True}, {"_id": 0}).to_list(50)
    
    # Saat filtresi uygula
    current_hour = datetime.now(timezone.utc).hour
    filtered = []
    for combo in combos:
        start = combo.get("start_hour")
        end = combo.get("end_hour")
        if start is None or end is None:
            filtered.append(combo)
        elif start <= current_hour < end:
            filtered.append(combo)
    
    return filtered


@router.get("/combos/all")
async def get_all_kiosk_combos(current_user: dict = Depends(get_current_user)):
    """Tüm comboları getir (admin için)"""
    db = get_db()
    if db is None:
        return DEFAULT_COMBOS
    
    combos = await db.kiosk_combos.find({}, {"_id": 0}).to_list(100)
    if not combos:
        # Varsayılan comboları yükle
        for combo in DEFAULT_COMBOS:
            existing = await db.kiosk_combos.find_one({"id": combo["id"]})
            if not existing:
                await db.kiosk_combos.insert_one({**combo})
        combos = await db.kiosk_combos.find({}, {"_id": 0}).to_list(100)
    return combos


@router.post("/combos")
async def create_kiosk_combo(combo: KioskCombo, current_user: dict = Depends(get_current_user)):
    """Yeni combo oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    combo_doc = {
        "id": str(uuid.uuid4())[:8],
        **combo.model_dump(exclude={"id"}),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kiosk_combos.insert_one(combo_doc)
    combo_doc.pop("_id", None)
    
    await _update_kiosk_version(db)
    return combo_doc


@router.put("/combos/{combo_id}")
async def update_kiosk_combo(combo_id: str, combo: KioskCombo, current_user: dict = Depends(get_current_user)):
    """Combo güncelle"""
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
    """Combo sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_combos.delete_one({"id": combo_id})
    await _update_kiosk_version(db)
    
    return {"status": "deleted"}


# ==================== PROMOSYON YÖNETİMİ ====================

DEFAULT_PROMOTIONS = [
    {
        "id": "happy-hour",
        "title": "Happy Hour! 🎉",
        "description": "14:00-17:00 arası tüm burgerlerde %10 indirim",
        "discount_type": "percent",
        "discount_value": 10,
        "applicable_categories": ["Et Burger", "Premium", "Tavuk"],
        "start_hour": 14,
        "end_hour": 17,
        "is_active": True,
        "banner_color": "#FF6B00"
    },
    {
        "id": "hafta-sonu",
        "title": "Hafta Sonu Fırsatı 🔥",
        "description": "200₺ üzeri siparişlerde 30₺ indirim",
        "discount_type": "fixed",
        "discount_value": 30,
        "min_order_amount": 200,
        "is_active": True,
        "banner_color": "#E63946"
    }
]


@router.get("/promotions")
async def get_kiosk_promotions():
    """Aktif promosyonları getir (saat ve tarih filtreli)"""
    db = get_db()
    if db is None:
        return DEFAULT_PROMOTIONS
    
    promotions = await db.kiosk_promotions.find({"is_active": True}, {"_id": 0}).to_list(50)
    if not promotions:
        # Varsayılan promosyonları yükle
        for promo in DEFAULT_PROMOTIONS:
            existing = await db.kiosk_promotions.find_one({"id": promo["id"]})
            if not existing:
                await db.kiosk_promotions.insert_one({**promo})
        promotions = await db.kiosk_promotions.find({"is_active": True}, {"_id": 0}).to_list(50)
    
    # Saat filtresi
    current_hour = datetime.now(timezone.utc).hour
    filtered = []
    for promo in promotions:
        start = promo.get("start_hour")
        end = promo.get("end_hour")
        if start is None or end is None:
            filtered.append(promo)
        elif start <= current_hour < end:
            filtered.append(promo)
    
    return filtered


@router.get("/promotions/all")
async def get_all_kiosk_promotions(current_user: dict = Depends(get_current_user)):
    """Tüm promosyonları getir (admin için)"""
    db = get_db()
    if db is None:
        return DEFAULT_PROMOTIONS
    
    promotions = await db.kiosk_promotions.find({}, {"_id": 0}).to_list(100)
    if not promotions:
        # Varsayılan promosyonları yükle
        for promo in DEFAULT_PROMOTIONS:
            existing = await db.kiosk_promotions.find_one({"id": promo["id"]})
            if not existing:
                await db.kiosk_promotions.insert_one({**promo})
        promotions = await db.kiosk_promotions.find({}, {"_id": 0}).to_list(100)
    return promotions


@router.post("/promotions")
async def create_kiosk_promotion(promo: KioskPromotion, current_user: dict = Depends(get_current_user)):
    """Yeni promosyon oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    promo_doc = {
        "id": str(uuid.uuid4())[:8],
        **promo.model_dump(exclude={"id"}),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.kiosk_promotions.insert_one(promo_doc)
    promo_doc.pop("_id", None)
    
    await _update_kiosk_version(db)
    return promo_doc


@router.put("/promotions/{promo_id}")
async def update_kiosk_promotion(promo_id: str, promo: KioskPromotion, current_user: dict = Depends(get_current_user)):
    """Promosyon güncelle"""
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
    """Promosyon sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.kiosk_promotions.delete_one({"id": promo_id})
    await _update_kiosk_version(db)
    
    return {"status": "deleted"}



# ==================== SADAKAT PROGRAMI ====================

def calculate_tier(total_points: int) -> str:
    """Toplam puana göre üyelik seviyesini hesapla"""
    if total_points >= LOYALTY_CONFIG["tiers"]["platinum"]["min_points"]:
        return "platinum"
    elif total_points >= LOYALTY_CONFIG["tiers"]["gold"]["min_points"]:
        return "gold"
    elif total_points >= LOYALTY_CONFIG["tiers"]["silver"]["min_points"]:
        return "silver"
    return "bronze"


@router.get("/loyalty/config")
async def get_loyalty_config():
    """Sadakat programı ayarlarını getir"""
    return {
        "points_per_lira": LOYALTY_CONFIG["points_per_lira"],
        "tiers": LOYALTY_CONFIG["tiers"]
    }


@router.get("/loyalty/rewards")
async def get_loyalty_rewards():
    """Mevcut ödülleri getir"""
    db = get_db()
    if db is None:
        return DEFAULT_REWARDS
    
    rewards = await db.loyalty_rewards.find({"is_active": True}, {"_id": 0}).to_list(50)
    if not rewards:
        # Varsayılan ödülleri yükle
        for reward in DEFAULT_REWARDS:
            existing = await db.loyalty_rewards.find_one({"id": reward["id"]})
            if not existing:
                await db.loyalty_rewards.insert_one({**reward})
        rewards = await db.loyalty_rewards.find({"is_active": True}, {"_id": 0}).to_list(50)
    return rewards


@router.get("/loyalty/rewards/all")
async def get_all_loyalty_rewards(current_user: dict = Depends(get_current_user)):
    """Tüm ödülleri getir (admin için)"""
    db = get_db()
    if db is None:
        return DEFAULT_REWARDS
    
    rewards = await db.loyalty_rewards.find({}, {"_id": 0}).to_list(100)
    if not rewards:
        return DEFAULT_REWARDS
    return rewards


@router.post("/loyalty/rewards")
async def create_loyalty_reward(reward: LoyaltyReward, current_user: dict = Depends(get_current_user)):
    """Yeni ödül oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    reward_doc = {
        "id": str(uuid.uuid4())[:8],
        **reward.model_dump(exclude={"id"}),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.loyalty_rewards.insert_one(reward_doc)
    reward_doc.pop("_id", None)
    return reward_doc


@router.put("/loyalty/rewards/{reward_id}")
async def update_loyalty_reward(reward_id: str, reward: LoyaltyReward, current_user: dict = Depends(get_current_user)):
    """Ödül güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    update_data = reward.model_dump(exclude={"id"})
    await db.loyalty_rewards.update_one({"id": reward_id}, {"$set": update_data})
    return {"status": "success"}


@router.delete("/loyalty/rewards/{reward_id}")
async def delete_loyalty_reward(reward_id: str, current_user: dict = Depends(get_current_user)):
    """Ödül sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.loyalty_rewards.delete_one({"id": reward_id})
    return {"status": "deleted"}


@router.post("/loyalty/member/lookup")
async def lookup_loyalty_member(phone: str = Body(..., embed=True)):
    """Telefon numarasına göre üye ara veya yeni üye oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Telefon numarasını temizle
    clean_phone = "".join(filter(str.isdigit, phone))
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Geçersiz telefon numarası")
    
    # Üye ara
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    
    if member:
        # Mevcut üye - tier'ı güncelle
        tier = calculate_tier(member.get("total_points", 0))
        if tier != member.get("tier"):
            await db.loyalty_members.update_one({"phone": clean_phone}, {"$set": {"tier": tier}})
            member["tier"] = tier
        
        tier_info = LOYALTY_CONFIG["tiers"].get(tier, LOYALTY_CONFIG["tiers"]["bronze"])
        return {
            "is_new": False,
            "member": member,
            "tier_info": tier_info,
            "next_tier": _get_next_tier(tier, member.get("total_points", 0))
        }
    
    # Yeni üye oluştur
    new_member = {
        "id": str(uuid.uuid4())[:8],
        "phone": clean_phone,
        "name": None,
        "total_points": 0,
        "total_orders": 0,
        "total_spent": 0,
        "tier": "bronze",
        "qr_code": f"KASA-{clean_phone[-4:]}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_order_at": None
    }
    
    await db.loyalty_members.insert_one(new_member)
    new_member.pop("_id", None)
    
    tier_info = LOYALTY_CONFIG["tiers"]["bronze"]
    return {
        "is_new": True,
        "member": new_member,
        "tier_info": tier_info,
        "next_tier": _get_next_tier("bronze", 0),
        "welcome_bonus": 50  # Hoşgeldin bonusu
    }


def _get_next_tier(current_tier: str, current_points: int):
    """Sonraki tier bilgisini hesapla"""
    tiers = list(LOYALTY_CONFIG["tiers"].items())
    current_idx = next((i for i, (k, v) in enumerate(tiers) if k == current_tier), 0)
    
    if current_idx < len(tiers) - 1:
        next_tier_key, next_tier = tiers[current_idx + 1]
        return {
            "name": next_tier["name"],
            "icon": next_tier["icon"],
            "points_needed": next_tier["min_points"] - current_points
        }
    return None


@router.post("/loyalty/member/update-name")
async def update_member_name(phone: str = Body(...), name: str = Body(...)):
    """Üye adını güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    await db.loyalty_members.update_one(
        {"phone": clean_phone}, 
        {"$set": {"name": name}}
    )
    return {"status": "success"}


@router.post("/loyalty/earn")
async def earn_loyalty_points(
    phone: str = Body(...),
    order_total: float = Body(...),
    order_id: str = Body(None)
):
    """Sipariş sonrası puan kazan"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    # Tier bonus çarpanını al
    tier = member.get("tier", "bronze")
    tier_info = LOYALTY_CONFIG["tiers"].get(tier, LOYALTY_CONFIG["tiers"]["bronze"])
    multiplier = tier_info.get("bonus_multiplier", 1.0)
    
    # Puan hesapla
    base_points = int(order_total * LOYALTY_CONFIG["points_per_lira"])
    bonus_points = int(base_points * (multiplier - 1))
    total_earned = base_points + bonus_points
    
    # Üyeyi güncelle
    new_total_points = member.get("total_points", 0) + total_earned
    new_tier = calculate_tier(new_total_points)
    
    await db.loyalty_members.update_one(
        {"phone": clean_phone},
        {
            "$set": {
                "tier": new_tier,
                "last_order_at": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {
                "total_points": total_earned,
                "total_orders": 1,
                "total_spent": order_total
            }
        }
    )
    
    # Transaction kaydet
    await db.loyalty_transactions.insert_one({
        "member_id": member["id"],
        "order_id": order_id,
        "points": total_earned,
        "transaction_type": "earn",
        "description": f"₺{order_total:.0f} sipariş - {base_points} + {bonus_points} bonus puan",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    tier_upgraded = new_tier != tier
    
    return {
        "base_points": base_points,
        "bonus_points": bonus_points,
        "total_earned": total_earned,
        "new_total": new_total_points,
        "tier": new_tier,
        "tier_upgraded": tier_upgraded,
        "tier_info": LOYALTY_CONFIG["tiers"].get(new_tier)
    }


@router.post("/loyalty/redeem")
async def redeem_loyalty_reward(
    phone: str = Body(...),
    reward_id: str = Body(...)
):
    """Ödül kullan"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    # Ödülü bul
    reward = await db.loyalty_rewards.find_one({"id": reward_id, "is_active": True}, {"_id": 0})
    if not reward:
        reward = next((r for r in DEFAULT_REWARDS if r["id"] == reward_id and r["is_active"]), None)
    
    if not reward:
        raise HTTPException(status_code=404, detail="Ödül bulunamadı")
    
    # Puan kontrolü
    if member.get("total_points", 0) < reward["points_required"]:
        raise HTTPException(status_code=400, detail="Yetersiz puan")
    
    # Puanları düş
    new_total = member.get("total_points", 0) - reward["points_required"]
    await db.loyalty_members.update_one(
        {"phone": clean_phone},
        {"$set": {"total_points": new_total}}
    )
    
    # Transaction kaydet
    await db.loyalty_transactions.insert_one({
        "member_id": member["id"],
        "reward_id": reward_id,
        "points": -reward["points_required"],
        "transaction_type": "redeem",
        "description": f"Ödül: {reward['name']}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "status": "success",
        "reward": reward,
        "points_used": reward["points_required"],
        "new_total": new_total
    }


@router.get("/loyalty/member/{phone}/history")
async def get_member_history(phone: str):
    """Üye puan geçmişini getir"""
    db = get_db()
    if db is None:
        return []
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    transactions = await db.loyalty_transactions.find(
        {"member_id": member["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return transactions


@router.get("/loyalty/members")
async def get_all_loyalty_members(current_user: dict = Depends(get_current_user)):
    """Tüm sadakat üyelerini getir (admin için)"""
    db = get_db()
    if db is None:
        return []
    
    members = await db.loyalty_members.find({}, {"_id": 0}).sort("total_points", -1).to_list(500)
    return members


@router.get("/loyalty/stats")
async def get_loyalty_stats(current_user: dict = Depends(get_current_user)):
    """Sadakat programı istatistikleri"""
    db = get_db()
    if db is None:
        return {"total_members": 0, "total_points_earned": 0}
    
    total_members = await db.loyalty_members.count_documents({})
    
    # Tier dağılımı
    bronze = await db.loyalty_members.count_documents({"tier": "bronze"})
    silver = await db.loyalty_members.count_documents({"tier": "silver"})
    gold = await db.loyalty_members.count_documents({"tier": "gold"})
    platinum = await db.loyalty_members.count_documents({"tier": "platinum"})
    
    # Toplam harcama
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_spent"}}}]
    result = await db.loyalty_members.aggregate(pipeline).to_list(1)
    total_spent = result[0]["total"] if result else 0
    
    return {
        "total_members": total_members,
        "total_spent": total_spent,
        "tier_distribution": {
            "bronze": bronze,
            "silver": silver,
            "gold": gold,
            "platinum": platinum
        }
    }



# ==================== REFERANS SİSTEMİ ====================

REFERRAL_BONUS = 100  # Her iki tarafa verilecek bonus puan

@router.get("/loyalty/member/{phone}/referral-code")
async def get_referral_code(phone: str):
    """Üyenin referans kodunu getir"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    # Referans kodu yoksa oluştur
    if not member.get("referral_code"):
        referral_code = f"KB{clean_phone[-4:]}{str(uuid.uuid4())[:4].upper()}"
        await db.loyalty_members.update_one(
            {"phone": clean_phone},
            {"$set": {"referral_code": referral_code}}
        )
        member["referral_code"] = referral_code
    
    # Kaç kişi davet edilmiş
    referral_count = await db.loyalty_members.count_documents({"referred_by": member.get("referral_code")})
    
    return {
        "referral_code": member.get("referral_code"),
        "referral_count": referral_count,
        "bonus_per_referral": REFERRAL_BONUS
    }


@router.post("/loyalty/member/apply-referral")
async def apply_referral_code(phone: str = Body(...), referral_code: str = Body(...)):
    """Referans kodu uygula - yeni üyeye ve referans sahibine bonus ver"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    clean_phone = "".join(filter(str.isdigit, phone))
    
    # Yeni üyeyi bul
    new_member = await db.loyalty_members.find_one({"phone": clean_phone}, {"_id": 0})
    if not new_member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    # Zaten referans kullanmış mı?
    if new_member.get("referred_by"):
        raise HTTPException(status_code=400, detail="Bu hesap zaten bir referans kodu kullanmış")
    
    # Referans kodu geçerli mi?
    referrer = await db.loyalty_members.find_one({"referral_code": referral_code.upper()}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Geçersiz referans kodu")
    
    # Kendi kodunu kullanamaz
    if referrer["phone"] == clean_phone:
        raise HTTPException(status_code=400, detail="Kendi referans kodunuzu kullanamazsınız")
    
    # Yeni üyeye bonus ver ve referansı kaydet
    await db.loyalty_members.update_one(
        {"phone": clean_phone},
        {
            "$set": {"referred_by": referral_code.upper()},
            "$inc": {"total_points": REFERRAL_BONUS}
        }
    )
    
    # Referans sahibine bonus ver
    await db.loyalty_members.update_one(
        {"referral_code": referral_code.upper()},
        {"$inc": {"total_points": REFERRAL_BONUS, "referral_earned": REFERRAL_BONUS}}
    )
    
    # Transaction kaydet - yeni üye
    await db.loyalty_transactions.insert_one({
        "member_id": new_member["id"],
        "points": REFERRAL_BONUS,
        "transaction_type": "referral_bonus",
        "description": f"Referans bonusu ({referral_code.upper()})",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Transaction kaydet - referans sahibi
    await db.loyalty_transactions.insert_one({
        "member_id": referrer["id"],
        "points": REFERRAL_BONUS,
        "transaction_type": "referral_earn",
        "description": f"Arkadaş daveti bonusu ({clean_phone[-4:]})",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "status": "success",
        "bonus_earned": REFERRAL_BONUS,
        "message": f"Tebrikler! {REFERRAL_BONUS} puan kazandınız!"
    }


@router.get("/loyalty/referral-stats")
async def get_referral_stats(current_user: dict = Depends(get_current_user)):
    """Referans programı istatistikleri (admin)"""
    db = get_db()
    if db is None:
        return {"total_referrals": 0, "total_bonus_given": 0}
    
    total_referrals = await db.loyalty_members.count_documents({"referred_by": {"$exists": True, "$ne": None}})
    
    # En çok davet eden üyeler
    pipeline = [
        {"$match": {"referral_code": {"$exists": True}}},
        {"$lookup": {
            "from": "loyalty_members",
            "localField": "referral_code",
            "foreignField": "referred_by",
            "as": "referrals"
        }},
        {"$project": {
            "_id": 0,
            "phone": 1,
            "name": 1,
            "referral_code": 1,
            "referral_count": {"$size": "$referrals"}
        }},
        {"$match": {"referral_count": {"$gt": 0}}},
        {"$sort": {"referral_count": -1}},
        {"$limit": 10}
    ]
    top_referrers = await db.loyalty_members.aggregate(pipeline).to_list(10)
    
    return {
        "total_referrals": total_referrals,
        "total_bonus_given": total_referrals * REFERRAL_BONUS * 2,
        "bonus_per_referral": REFERRAL_BONUS,
        "top_referrers": top_referrers
    }
