"""Products Router - Ürün Yönetimi"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from models.product import ProductCreate, ProductResponse
from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("", response_model=ProductResponse)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    product_doc = {
        "id": str(uuid.uuid4()),
        **product.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    product_doc.pop("_id", None)
    return ProductResponse(**product_doc)

@router.get("")
async def get_products(
    skip: int = 0,
    limit: int = 500,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        return []
    
    # Query filter oluştur
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}}
        ]
    
    # Sayfalama ile ürünleri getir (max 500)
    limit = min(limit, 500)  # Max 500 limit
    products = await db.products.find(query, {"_id": 0}).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return ProductResponse(**product)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    await db.products.update_one({"id": product_id}, {"$set": product.model_dump()})
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return ProductResponse(**updated)

@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {"status": "deleted"}
