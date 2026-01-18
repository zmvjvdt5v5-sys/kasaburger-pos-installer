"""
KBYS - Kasa Burger Yönetim Sistemi
Modüler Backend API

Bu dosya eski monolitik server.py yerine kullanılacaktır.
Tüm router'lar /routers klasöründen import edilir.
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
from routers import auth, pos, inpos

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("KBYS Backend başlatılıyor...")
    await connect_db()
    db = get_db()
    if db:
        logger.info("MongoDB bağlantısı başarılı")
        # Admin kullanıcı oluştur
        from utils.auth import hash_password
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
    else:
        logger.warning("MongoDB bağlantısı yok - demo mod")
    
    yield
    
    # Shutdown
    await close_db()
    logger.info("KBYS Backend kapatıldı")

# App
app = FastAPI(
    title="KBYS API",
    description="Kasa Burger Yönetim Sistemi - ERP & POS API",
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
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/")
async def root():
    return {"message": "KBYS API v2.0 - Modüler Yapı", "docs": "/docs"}

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(pos.router, prefix="/api")
app.include_router(inpos.router, prefix="/api")

# NOT: Eski server.py'deki diğer endpoint'ler buraya taşınacak
# Şimdilik eski server.py hala aktif, bu dosya test amaçlı
