"""Product, Material, Recipe Models"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    stock: int = 0
    category: Optional[str] = None
    description: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    sku: Optional[str] = None
    price: Optional[float] = 0
    stock: Optional[int] = 0
    category: Optional[str] = None
    description: Optional[str] = None

class MaterialCreate(BaseModel):
    name: str
    sku: Optional[str] = None  # Otomatik oluşturulacak
    unit: str
    stock: float = 0
    min_stock: float = 0
    cost: float = 0
    price: Optional[float] = None  # Satış fiyatı
    supplier: Optional[str] = None

class MaterialResponse(BaseModel):
    id: str
    name: str
    sku: str
    unit: str
    stock: float
    min_stock: float
    cost: float
    price: Optional[float] = None
    supplier: Optional[str] = None
    created_at: Optional[str] = None

class RecipeIngredient(BaseModel):
    material_id: str
    material_name: str
    quantity: float
    unit: str

class RecipeCreate(BaseModel):
    product_id: str
    product_name: str
    ingredients: List[RecipeIngredient]
    yield_amount: int = 1
    notes: Optional[str] = None

class RecipeResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    ingredients: List[RecipeIngredient]
    yield_amount: int
    notes: Optional[str] = None
