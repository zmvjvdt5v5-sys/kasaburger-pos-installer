"""Dealers Router - Bayi Yönetimi"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from models.dealer import DealerCreate, DealerResponse, DealerLogin, DealerOrderCreate
from utils.auth import get_current_user, get_current_dealer, hash_password, verify_password, create_token
from utils.database import get_db

router = APIRouter(prefix="/dealers", tags=["Dealers"])

@router.post("", response_model=DealerResponse)
async def create_dealer(dealer: DealerCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    existing = await db.dealers.find_one({"code": dealer.code})
    if existing:
        raise HTTPException(status_code=400, detail="Bu bayi kodu zaten mevcut")
    
    dealer_doc = {
        "id": str(uuid.uuid4()),
        **dealer.model_dump(),
        "password": hash_password(dealer.password),
        "current_balance": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.dealers.insert_one(dealer_doc)
    dealer_doc.pop("_id", None)
    dealer_doc.pop("password", None)
    return DealerResponse(**dealer_doc)

@router.get("", response_model=List[DealerResponse])
async def get_dealers(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    dealers = await db.dealers.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [DealerResponse(**d) for d in dealers]

@router.get("/{dealer_id}", response_model=DealerResponse)
async def get_dealer(dealer_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    dealer = await db.dealers.find_one({"id": dealer_id}, {"_id": 0, "password": 0})
    if not dealer:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    return DealerResponse(**dealer)

@router.put("/{dealer_id}", response_model=DealerResponse)
async def update_dealer(dealer_id: str, dealer: DealerCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    update_data = dealer.model_dump()
    if dealer.password:
        update_data["password"] = hash_password(dealer.password)
    
    await db.dealers.update_one({"id": dealer_id}, {"$set": update_data})
    updated = await db.dealers.find_one({"id": dealer_id}, {"_id": 0, "password": 0})
    return DealerResponse(**updated)

@router.delete("/{dealer_id}")
async def delete_dealer(dealer_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.dealers.delete_one({"id": dealer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    return {"status": "deleted"}

# Bayi Login
@router.post("/login")
async def dealer_login(credentials: DealerLogin):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    dealer = await db.dealers.find_one({"code": credentials.code})
    if not dealer:
        raise HTTPException(status_code=401, detail="Geçersiz bayi kodu veya şifre")
    
    if not verify_password(credentials.password, dealer["password"]):
        raise HTTPException(status_code=401, detail="Geçersiz bayi kodu veya şifre")
    
    if dealer.get("status") != "active":
        raise HTTPException(status_code=403, detail="Bayi hesabı aktif değil")
    
    token = create_token(dealer["id"], dealer["code"], "dealer")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "dealer": {
            "id": dealer["id"],
            "code": dealer["code"],
            "name": dealer["name"],
            "role": "dealer"
        }
    }

@router.get("/me/info")
async def get_dealer_info(current_dealer: dict = Depends(get_current_dealer)):
    db = get_db()
    if not db:
        return {"id": current_dealer.get("user_id"), "code": current_dealer.get("email"), "role": "dealer"}
    
    dealer = await db.dealers.find_one(
        {"$or": [{"id": current_dealer.get("user_id")}, {"code": current_dealer.get("email")}]},
        {"_id": 0, "password": 0}
    )
    if dealer:
        dealer["role"] = "dealer"
        return dealer
    
    return {"id": current_dealer.get("user_id"), "code": current_dealer.get("email"), "role": "dealer"}
