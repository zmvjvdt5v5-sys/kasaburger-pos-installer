"""
KBYS - Kasa Burger Yönetim Sistemi
Modüler Backend API v2.0
"""
import os
import sys
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# Path ayarı
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Database
from utils.database import connect_db, close_db, get_db

# Routers
from routers import auth, pos, inpos, products, materials, dealers, kiosk, delivery, branches, orders

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("KBYS Backend v2.0 başlatılıyor...")
    await connect_db()
    db = get_db()
    if db is not None:
        logger.info("MongoDB bağlantısı başarılı")
        from utils.auth import hash_password
        # Admin kullanıcı
        admin = await db.users.find_one({"email": "admin@kasaburger.net.tr"})
        if not admin:
            await db.users.insert_one({
                "id": "admin-001",
                "email": "admin@kasaburger.net.tr",
                "password": hash_password("admin123"),
                "name": "Admin",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info("Admin kullanıcı oluşturuldu")
        # Test bayi
        dealer = await db.dealers.find_one({"code": "MEKGRUP"})
        if not dealer:
            await db.dealers.insert_one({
                "id": "dealer-001",
                "code": "MEKGRUP",
                "name": "Mekgrup Bayi",
                "email": "mekgrup@kasaburger.net.tr",
                "phone": "0555 555 5555",
                "address": "İstanbul",
                "password": hash_password("1234"),
                "status": "active",
                "credit_limit": 50000,
                "current_balance": 0,
                "payment_term_days": 30,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info("Test bayi oluşturuldu")
    else:
        logger.warning("MongoDB bağlantısı yok - demo mod")
    
    yield
    
    await close_db()
    logger.info("KBYS Backend kapatıldı")

# App
app = FastAPI(
    title="KBYS API",
    description="Kasa Burger Yönetim Sistemi - ERP & POS API v2.0",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Middleware
class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityMiddleware)

# Health Check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/")
async def root():
    return {"message": "KBYS API v2.0 - Modüler Yapı", "docs": "/docs"}

# Include All Routers
app.include_router(auth.router, prefix="/api")
app.include_router(pos.router, prefix="/api")
app.include_router(inpos.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(materials.router, prefix="/api")
app.include_router(dealers.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(kiosk.router, prefix="/api")
app.include_router(delivery.router, prefix="/api")
app.include_router(branches.router, prefix="/api")

# Admin endpoints
from fastapi import Depends
from utils.auth import get_current_user, hash_password
from pydantic import BaseModel, EmailStr
from typing import Optional

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    role: Optional[str] = "user"

@app.post("/api/admin/users")
async def admin_create_user(user_data: AdminUserCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return {"error": "Veritabanı bağlantısı yok"}
    
    if current_user.get("role") != "admin":
        return {"error": "Yetkiniz yok"}
    
    import uuid
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role or "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("_id", None)
    user_doc.pop("password", None)
    return {"status": "success", "user": user_doc}

@app.get("/api/admin/users")
async def admin_list_users(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    return users

@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return {"error": "Veritabanı bağlantısı yok"}
    
    if current_user.get("role") != "admin":
        return {"error": "Yetkiniz yok"}
    
    await db.users.delete_one({"id": user_id})
    return {"status": "deleted"}

# Dashboard stats
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return {"totalProducts": 0, "totalOrders": 0, "totalRevenue": 0, "totalDealers": 0}
    
    products = await db.products.count_documents({})
    orders = await db.orders.count_documents({})
    dealers = await db.dealers.count_documents({})
    
    # Toplam gelir
    all_orders = await db.orders.find({}, {"total": 1}).to_list(1000)
    revenue = sum(o.get("total", 0) for o in all_orders)
    
    return {
        "totalProducts": products,
        "totalOrders": orders,
        "totalRevenue": revenue,
        "totalDealers": dealers
    }
