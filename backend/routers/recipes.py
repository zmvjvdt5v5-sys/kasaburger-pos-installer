"""Recipes Router - Reçete Yönetimi"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/recipes", tags=["Recipes"])

SUPER_ADMIN_EMAIL = "admin@kasaburger.net.tr"

class RecipeIngredient(BaseModel):
    material_id: str
    material_name: str
    quantity: float
    unit: str

class RecipeCreate(BaseModel):
    product_id: str
    product_name: str
    ingredients: List[RecipeIngredient]
    instructions: Optional[str] = ""
    yield_quantity: Optional[float] = 1
    yield_unit: Optional[str] = "adet"

class RecipeResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    ingredients: List[dict]
    instructions: Optional[str] = ""
    yield_quantity: Optional[float] = 1
    yield_unit: Optional[str] = "adet"
    created_at: Optional[str] = None


@router.post("", response_model=RecipeResponse)
async def create_recipe(recipe: RecipeCreate, current_user: dict = Depends(get_current_user)):
    """Yeni reçete oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    recipe_id = str(uuid.uuid4())
    recipe_doc = {
        "id": recipe_id,
        **recipe.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.recipes.insert_one(recipe_doc)
    recipe_doc.pop("_id", None)
    return RecipeResponse(**recipe_doc)


@router.get("")
async def get_recipes(current_user: dict = Depends(get_current_user)):
    """Tüm reçeteleri getir"""
    db = get_db()
    if db is None:
        return []
    
    # Sadece super admin erişebilir
    if current_user.get("email") != SUPER_ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Bu sayfaya erişim yetkiniz yok")
    
    recipes = await db.recipes.find({}, {"_id": 0}).to_list(1000)
    return recipes


@router.get("/{recipe_id}")
async def get_recipe(recipe_id: str, current_user: dict = Depends(get_current_user)):
    """Belirli bir reçeteyi getir"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    return recipe


@router.put("/{recipe_id}")
async def update_recipe(recipe_id: str, recipe: RecipeCreate, current_user: dict = Depends(get_current_user)):
    """Reçete güncelle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.recipes.update_one(
        {"id": recipe_id},
        {"$set": recipe.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    
    updated = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    return updated


@router.delete("/{recipe_id}")
async def delete_recipe(recipe_id: str, current_user: dict = Depends(get_current_user)):
    """Reçete sil"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.recipes.delete_one({"id": recipe_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    return {"message": "Reçete silindi"}
