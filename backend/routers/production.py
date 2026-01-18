"""Production Router - Üretim Yönetimi"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/production", tags=["Production"])


class ProductionCreate(BaseModel):
    recipe_id: Optional[str] = None
    product_id: str
    product_name: str
    quantity: float
    unit: str = "adet"
    planned_date: str
    notes: Optional[str] = ""

class ProductionResponse(BaseModel):
    id: str
    recipe_id: Optional[str] = None
    product_id: str
    product_name: str
    quantity: float
    unit: str = "adet"
    planned_date: str
    notes: Optional[str] = ""
    status: str = "planned"
    created_at: Optional[str] = None
    completed_at: Optional[str] = None


@router.post("", response_model=ProductionResponse)
async def create_production(production: ProductionCreate, current_user: dict = Depends(get_current_user)):
    """Yeni üretim emri oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    production_id = str(uuid.uuid4())
    production_doc = {
        "id": production_id,
        **production.model_dump(),
        "status": "planned",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.production.insert_one(production_doc)
    production_doc.pop("_id", None)
    return ProductionResponse(**production_doc)


@router.get("")
async def get_productions(current_user: dict = Depends(get_current_user)):
    """Tüm üretim emirlerini getir"""
    db = get_db()
    if db is None:
        return []
    
    productions = await db.production.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return productions


@router.get("/{production_id}")
async def get_production(production_id: str, current_user: dict = Depends(get_current_user)):
    """Belirli bir üretim emrini getir"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Üretim emri bulunamadı")
    
    production = await db.production.find_one({"id": production_id}, {"_id": 0})
    if not production:
        raise HTTPException(status_code=404, detail="Üretim emri bulunamadı")
    return production


@router.put("/{production_id}/status")
async def update_production_status(production_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Üretim durumunu güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    update_data = {"status": status}
    if status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.production.update_one({"id": production_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Üretim emri bulunamadı")
    
    return {"message": "Durum güncellendi"}


@router.put("/{production_id}")
async def update_production(production_id: str, production: ProductionCreate, current_user: dict = Depends(get_current_user)):
    """Üretim emrini güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.production.update_one(
        {"id": production_id},
        {"$set": production.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Üretim emri bulunamadı")
    
    updated = await db.production.find_one({"id": production_id}, {"_id": 0})
    return updated


@router.delete("/{production_id}")
async def delete_production(production_id: str, current_user: dict = Depends(get_current_user)):
    """Üretim emrini sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.production.delete_one({"id": production_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Üretim emri bulunamadı")
    return {"message": "Üretim emri silindi"}
