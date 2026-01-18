"""Materials Router - Hammadde Yönetimi"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from models.product import MaterialCreate, MaterialResponse
from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/materials", tags=["Materials"])

@router.post("", response_model=MaterialResponse)
async def create_material(material: MaterialCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    material_doc = {
        "id": str(uuid.uuid4()),
        **material.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.materials.insert_one(material_doc)
    material_doc.pop("_id", None)
    return MaterialResponse(**material_doc)

@router.get("", response_model=List[MaterialResponse])
async def get_materials(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        return []
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    return [MaterialResponse(**m) for m in materials]

@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(material_id: str, material: MaterialCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.materials.update_one({"id": material_id}, {"$set": material.model_dump()})
    updated = await db.materials.find_one({"id": material_id}, {"_id": 0})
    return MaterialResponse(**updated)

@router.delete("/{material_id}")
async def delete_material(material_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")
    return {"status": "deleted"}
