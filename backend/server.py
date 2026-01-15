from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import io

# Lazy imports for PDF/Excel - these may not be available in all environments
reportlab_available = False
openpyxl_available = False

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    reportlab_available = True
except ImportError:
    pass

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
    openpyxl_available = True
except ImportError:
    pass

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with error handling
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'kasaburger_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'kasaburger_secret_key_2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="KasaBurger API", version="1.0.1")

# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root level health check for Kubernetes/deployment probes
@app.get("/health", tags=["Health"])
async def root_health_check():
    """Health check endpoint for Kubernetes probes"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {"message": "KasaBurger API v1.0.1", "status": "active"}

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Product Models
class ProductCreate(BaseModel):
    name: str
    code: str
    unit: str = "kg"
    base_price: float
    description: Optional[str] = ""

class ProductResponse(BaseModel):
    id: str
    name: str
    code: str
    unit: str
    base_price: float
    description: str
    created_at: str

# Material Models
class MaterialCreate(BaseModel):
    name: str
    code: str
    unit: str
    stock_quantity: float = 0
    min_stock: float = 0
    unit_price: float = 0

class MaterialResponse(BaseModel):
    id: str
    name: str
    code: str
    unit: str
    stock_quantity: float
    min_stock: float
    unit_price: float
    created_at: str

# Recipe Models
class RecipeIngredient(BaseModel):
    material_id: str
    material_name: str
    quantity: float
    unit: str

class RecipeCreate(BaseModel):
    product_id: str
    product_name: str
    ingredients: List[RecipeIngredient]
    yield_quantity: float
    yield_unit: str = "kg"
    notes: Optional[str] = ""

class RecipeResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    ingredients: List[RecipeIngredient]
    yield_quantity: float
    yield_unit: str
    notes: str
    created_at: str

# Production Models
class ProductionCreate(BaseModel):
    recipe_id: str
    product_name: str
    quantity: float
    planned_date: str
    notes: Optional[str] = ""

class ProductionResponse(BaseModel):
    id: str
    recipe_id: str
    product_name: str
    quantity: float
    planned_date: str
    status: str
    notes: str
    created_at: str
    completed_at: Optional[str] = None

# Dealer Models
class DealerPricing(BaseModel):
    product_id: str
    product_name: str
    special_price: float

class DealerCreate(BaseModel):
    name: str
    code: str
    contact_person: str
    phone: str
    email: Optional[str] = ""
    address: str
    tax_number: Optional[str] = ""
    pricing: Optional[List[DealerPricing]] = []

class DealerResponse(BaseModel):
    id: str
    name: str
    code: str
    contact_person: str
    phone: str
    email: str
    address: str
    tax_number: str
    pricing: List[DealerPricing]
    balance: float
    created_at: str

# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: float
    unit_price: float
    total: float

class OrderCreate(BaseModel):
    dealer_id: str
    dealer_name: str
    items: List[OrderItem]
    delivery_date: str
    notes: Optional[str] = ""

class OrderResponse(BaseModel):
    id: str
    order_number: str
    dealer_id: str
    dealer_name: str
    items: List[OrderItem]
    subtotal: float
    tax_amount: float
    total: float
    delivery_date: str
    status: str
    notes: str
    created_at: str

# Invoice Models
class InvoiceCreate(BaseModel):
    order_id: str
    dealer_id: str
    dealer_name: str
    items: List[OrderItem]
    subtotal: float
    tax_rate: float = 20
    tax_amount: float
    total: float
    due_date: str

class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    order_id: str
    dealer_id: str
    dealer_name: str
    items: List[OrderItem]
    subtotal: float
    tax_rate: float
    tax_amount: float
    total: float
    due_date: str
    status: str
    created_at: str
    paid_at: Optional[str] = None

# Transaction Models
class TransactionCreate(BaseModel):
    type: str  # income, expense
    category: str
    amount: float
    description: str
    reference_id: Optional[str] = ""
    reference_type: Optional[str] = ""

class TransactionResponse(BaseModel):
    id: str
    type: str
    category: str
    amount: float
    description: str
    reference_id: str
    reference_type: str
    created_at: str

# Stock Movement Models
class StockMovementCreate(BaseModel):
    material_id: str
    material_name: str
    type: str  # in, out
    quantity: float
    reason: str
    reference_id: Optional[str] = ""

class StockMovementResponse(BaseModel):
    id: str
    material_id: str
    material_name: str
    type: str
    quantity: float
    reason: str
    reference_id: str
    created_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email, user_data.role)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        created_at=user_doc["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Geçersiz email veya şifre")
    
    token = create_token(user["id"], user["email"], user["role"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )

# ==================== PRODUCT ROUTES ====================

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        **product.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    return ProductResponse(**{k: v for k, v in product_doc.items() if k != "_id"})

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return [ProductResponse(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return ProductResponse(**product)

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductCreate, current_user: dict = Depends(get_current_user)):
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return ProductResponse(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {"message": "Ürün silindi"}

# ==================== MATERIAL ROUTES ====================

@api_router.post("/materials", response_model=MaterialResponse)
async def create_material(material: MaterialCreate, current_user: dict = Depends(get_current_user)):
    material_id = str(uuid.uuid4())
    material_doc = {
        "id": material_id,
        **material.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.materials.insert_one(material_doc)
    return MaterialResponse(**{k: v for k, v in material_doc.items() if k != "_id"})

@api_router.get("/materials", response_model=List[MaterialResponse])
async def get_materials(current_user: dict = Depends(get_current_user)):
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    return [MaterialResponse(**m) for m in materials]

@api_router.put("/materials/{material_id}", response_model=MaterialResponse)
async def update_material(material_id: str, material: MaterialCreate, current_user: dict = Depends(get_current_user)):
    result = await db.materials.update_one(
        {"id": material_id},
        {"$set": material.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")
    updated = await db.materials.find_one({"id": material_id}, {"_id": 0})
    return MaterialResponse(**updated)

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hammadde bulunamadı")
    return {"message": "Hammadde silindi"}

# ==================== RECIPE ROUTES ====================

@api_router.post("/recipes", response_model=RecipeResponse)
async def create_recipe(recipe: RecipeCreate, current_user: dict = Depends(get_current_user)):
    recipe_id = str(uuid.uuid4())
    recipe_doc = {
        "id": recipe_id,
        **recipe.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.recipes.insert_one(recipe_doc)
    return RecipeResponse(**{k: v for k, v in recipe_doc.items() if k != "_id"})

@api_router.get("/recipes", response_model=List[RecipeResponse])
async def get_recipes(current_user: dict = Depends(get_current_user)):
    recipes = await db.recipes.find({}, {"_id": 0}).to_list(1000)
    return [RecipeResponse(**r) for r in recipes]

@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.recipes.delete_one({"id": recipe_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reçete bulunamadı")
    return {"message": "Reçete silindi"}

# ==================== PRODUCTION ROUTES ====================

@api_router.post("/production", response_model=ProductionResponse)
async def create_production(production: ProductionCreate, current_user: dict = Depends(get_current_user)):
    production_id = str(uuid.uuid4())
    production_doc = {
        "id": production_id,
        **production.model_dump(),
        "status": "planned",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.production.insert_one(production_doc)
    return ProductionResponse(**{k: v for k, v in production_doc.items() if k != "_id"})

@api_router.get("/production", response_model=List[ProductionResponse])
async def get_productions(current_user: dict = Depends(get_current_user)):
    productions = await db.production.find({}, {"_id": 0}).to_list(1000)
    return [ProductionResponse(**p) for p in productions]

@api_router.put("/production/{production_id}/status")
async def update_production_status(production_id: str, status: str, current_user: dict = Depends(get_current_user)):
    update_data = {"status": status}
    if status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.production.update_one(
        {"id": production_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Üretim emri bulunamadı")
    return {"message": "Durum güncellendi"}

@api_router.delete("/production/{production_id}")
async def delete_production(production_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.production.delete_one({"id": production_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Üretim emri bulunamadı")
    return {"message": "Üretim emri silindi"}

# ==================== DEALER ROUTES ====================

@api_router.post("/dealers", response_model=DealerResponse)
async def create_dealer(dealer: DealerCreate, current_user: dict = Depends(get_current_user)):
    dealer_id = str(uuid.uuid4())
    dealer_doc = {
        "id": dealer_id,
        **dealer.model_dump(),
        "balance": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.dealers.insert_one(dealer_doc)
    return DealerResponse(**{k: v for k, v in dealer_doc.items() if k != "_id"})

@api_router.get("/dealers", response_model=List[DealerResponse])
async def get_dealers(current_user: dict = Depends(get_current_user)):
    dealers = await db.dealers.find({}, {"_id": 0}).to_list(1000)
    return [DealerResponse(**d) for d in dealers]

@api_router.get("/dealers/{dealer_id}", response_model=DealerResponse)
async def get_dealer(dealer_id: str, current_user: dict = Depends(get_current_user)):
    dealer = await db.dealers.find_one({"id": dealer_id}, {"_id": 0})
    if not dealer:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    return DealerResponse(**dealer)

@api_router.put("/dealers/{dealer_id}", response_model=DealerResponse)
async def update_dealer(dealer_id: str, dealer: DealerCreate, current_user: dict = Depends(get_current_user)):
    result = await db.dealers.update_one(
        {"id": dealer_id},
        {"$set": dealer.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    updated = await db.dealers.find_one({"id": dealer_id}, {"_id": 0})
    return DealerResponse(**updated)

@api_router.delete("/dealers/{dealer_id}")
async def delete_dealer(dealer_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.dealers.delete_one({"id": dealer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    return {"message": "Bayi silindi"}

# ==================== ORDER ROUTES ====================

async def generate_order_number():
    count = await db.orders.count_documents({})
    return f"SIP-{str(count + 1).zfill(6)}"

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    order_number = await generate_order_number()
    
    subtotal = sum(item.total for item in order.items)
    tax_amount = subtotal * 0.20
    total = subtotal + tax_amount
    
    order_doc = {
        "id": order_id,
        "order_number": order_number,
        **order.model_dump(),
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total": total,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    return OrderResponse(**{k: v for k, v in order_doc.items() if k != "_id"})

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [OrderResponse(**o) for o in orders]

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return {"message": "Durum güncellendi"}

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return {"message": "Sipariş silindi"}

# ==================== INVOICE ROUTES ====================

async def generate_invoice_number():
    count = await db.invoices.count_documents({})
    return f"FTR-{str(count + 1).zfill(6)}"

@api_router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(invoice: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    invoice_id = str(uuid.uuid4())
    invoice_number = await generate_invoice_number()
    
    invoice_doc = {
        "id": invoice_id,
        "invoice_number": invoice_number,
        **invoice.model_dump(),
        "status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "paid_at": None
    }
    await db.invoices.insert_one(invoice_doc)
    
    # Update dealer balance
    await db.dealers.update_one(
        {"id": invoice.dealer_id},
        {"$inc": {"balance": invoice.total}}
    )
    
    return InvoiceResponse(**{k: v for k, v in invoice_doc.items() if k != "_id"})

@api_router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(current_user: dict = Depends(get_current_user)):
    invoices = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [InvoiceResponse(**i) for i in invoices]

@api_router.put("/invoices/{invoice_id}/pay")
async def pay_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update dealer balance
    await db.dealers.update_one(
        {"id": invoice["dealer_id"]},
        {"$inc": {"balance": -invoice["total"]}}
    )
    
    # Create income transaction
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "type": "income",
        "category": "Satış",
        "amount": invoice["total"],
        "description": f"Fatura ödemesi: {invoice['invoice_number']}",
        "reference_id": invoice_id,
        "reference_type": "invoice",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Fatura ödendi"}

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    # If unpaid, reverse the dealer balance
    if invoice["status"] == "unpaid":
        await db.dealers.update_one(
            {"id": invoice["dealer_id"]},
            {"$inc": {"balance": -invoice["total"]}}
        )
    
    result = await db.invoices.delete_one({"id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    return {"message": "Fatura silindi"}

# ==================== TRANSACTION ROUTES ====================

@api_router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(transaction: TransactionCreate, current_user: dict = Depends(get_current_user)):
    transaction_id = str(uuid.uuid4())
    transaction_doc = {
        "id": transaction_id,
        **transaction.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction_doc)
    return TransactionResponse(**{k: v for k, v in transaction_doc.items() if k != "_id"})

@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [TransactionResponse(**t) for t in transactions]

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="İşlem bulunamadı")
    return {"message": "İşlem silindi"}

# ==================== STOCK MOVEMENT ROUTES ====================

@api_router.post("/stock-movements", response_model=StockMovementResponse)
async def create_stock_movement(movement: StockMovementCreate, current_user: dict = Depends(get_current_user)):
    movement_id = str(uuid.uuid4())
    movement_doc = {
        "id": movement_id,
        **movement.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.stock_movements.insert_one(movement_doc)
    
    # Update material stock
    quantity_change = movement.quantity if movement.type == "in" else -movement.quantity
    await db.materials.update_one(
        {"id": movement.material_id},
        {"$inc": {"stock_quantity": quantity_change}}
    )
    
    return StockMovementResponse(**{k: v for k, v in movement_doc.items() if k != "_id"})

@api_router.get("/stock-movements", response_model=List[StockMovementResponse])
async def get_stock_movements(current_user: dict = Depends(get_current_user)):
    movements = await db.stock_movements.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [StockMovementResponse(**m) for m in movements]

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    # Count documents
    total_products = await db.products.count_documents({})
    total_dealers = await db.dealers.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Calculate totals
    invoices = await db.invoices.find({}, {"_id": 0, "total": 1, "status": 1}).to_list(1000)
    total_revenue = sum(i["total"] for i in invoices if i["status"] == "paid")
    unpaid_invoices = sum(i["total"] for i in invoices if i["status"] == "unpaid")
    
    # Get transactions summary
    transactions = await db.transactions.find({}, {"_id": 0, "type": 1, "amount": 1}).to_list(1000)
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
    
    # Low stock materials
    low_stock_materials = await db.materials.find(
        {"$expr": {"$lte": ["$stock_quantity", "$min_stock"]}},
        {"_id": 0}
    ).to_list(100)
    
    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    # Production summary
    planned_production = await db.production.count_documents({"status": "planned"})
    in_progress_production = await db.production.count_documents({"status": "in_progress"})
    
    return {
        "total_products": total_products,
        "total_dealers": total_dealers,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue,
        "unpaid_invoices": unpaid_invoices,
        "total_income": total_income,
        "total_expense": total_expense,
        "net_profit": total_income - total_expense,
        "low_stock_materials": low_stock_materials,
        "recent_orders": recent_orders,
        "planned_production": planned_production,
        "in_progress_production": in_progress_production
    }

# ==================== DEALER PORTAL ROUTES ====================

class DealerLogin(BaseModel):
    dealer_code: str
    password: str

class DealerOrderCreate(BaseModel):
    items: List[OrderItem]
    delivery_date: str
    notes: Optional[str] = ""

@api_router.post("/dealer-portal/login")
async def dealer_portal_login(credentials: DealerLogin):
    dealer = await db.dealers.find_one({"code": credentials.dealer_code}, {"_id": 0})
    if not dealer:
        raise HTTPException(status_code=401, detail="Geçersiz bayi kodu")
    
    # Check if dealer has password set, if not use code as default
    stored_password = dealer.get("password", dealer["code"])
    if credentials.password != stored_password:
        raise HTTPException(status_code=401, detail="Geçersiz şifre")
    
    # Create dealer token
    payload = {
        "sub": dealer["id"],
        "dealer_code": dealer["code"],
        "dealer_name": dealer["name"],
        "type": "dealer",
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "dealer": {
            "id": dealer["id"],
            "name": dealer["name"],
            "code": dealer["code"],
            "balance": dealer.get("balance", 0)
        }
    }

async def get_current_dealer(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "dealer":
            raise HTTPException(status_code=401, detail="Bayi yetkisi gerekli")
        dealer = await db.dealers.find_one({"id": payload["sub"]}, {"_id": 0})
        if not dealer:
            raise HTTPException(status_code=401, detail="Bayi bulunamadı")
        return dealer
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

@api_router.get("/dealer-portal/me")
async def dealer_portal_me(dealer: dict = Depends(get_current_dealer)):
    return {
        "id": dealer["id"],
        "name": dealer["name"],
        "code": dealer["code"],
        "contact_person": dealer.get("contact_person", ""),
        "phone": dealer.get("phone", ""),
        "email": dealer.get("email", ""),
        "address": dealer.get("address", ""),
        "balance": dealer.get("balance", 0),
        "pricing": dealer.get("pricing", [])
    }

@api_router.get("/dealer-portal/products")
async def dealer_portal_products(dealer: dict = Depends(get_current_dealer)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    dealer_pricing = {p["product_id"]: p["special_price"] for p in dealer.get("pricing", [])}
    
    result = []
    for product in products:
        price = dealer_pricing.get(product["id"], product["base_price"])
        result.append({
            **product,
            "dealer_price": price
        })
    return result

@api_router.get("/dealer-portal/orders")
async def dealer_portal_orders(dealer: dict = Depends(get_current_dealer)):
    orders = await db.orders.find({"dealer_id": dealer["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.post("/dealer-portal/orders")
async def dealer_portal_create_order(order: DealerOrderCreate, dealer: dict = Depends(get_current_dealer)):
    order_id = str(uuid.uuid4())
    order_number = await generate_order_number()
    
    subtotal = sum(item.total for item in order.items)
    tax_amount = subtotal * 0.20
    total = subtotal + tax_amount
    
    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "dealer_id": dealer["id"],
        "dealer_name": dealer["name"],
        "items": [item.model_dump() for item in order.items],
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total": total,
        "delivery_date": order.delivery_date,
        "notes": order.notes or "",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "dealer_portal"
    }
    await db.orders.insert_one(order_doc)
    return OrderResponse(**{k: v for k, v in order_doc.items() if k != "_id"})

@api_router.get("/dealer-portal/invoices")
async def dealer_portal_invoices(dealer: dict = Depends(get_current_dealer)):
    invoices = await db.invoices.find({"dealer_id": dealer["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return invoices

# ==================== E-FATURA XML EXPORT ====================

@api_router.get("/invoices/{invoice_id}/xml")
async def get_invoice_xml(invoice_id: str, current_user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    dealer = await db.dealers.find_one({"id": invoice["dealer_id"]}, {"_id": 0})
    
    # Generate UBL-TR 1.2 compatible e-Invoice XML
    xml_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
    <cbc:ID>{invoice['invoice_number']}</cbc:ID>
    <cbc:CopyIndicator>false</cbc:CopyIndicator>
    <cbc:UUID>{invoice['id']}</cbc:UUID>
    <cbc:IssueDate>{invoice['created_at'][:10]}</cbc:IssueDate>
    <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>KASABURGER IMALATHANESI</cbc:Name>
            </cac:PartyName>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">{dealer.get('tax_number', '') if dealer else ''}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>{invoice['dealer_name']}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>{dealer.get('address', '') if dealer else ''}</cbc:StreetName>
            </cac:PostalAddress>
        </cac:Party>
    </cac:AccountingCustomerParty>
    
    <cac:PaymentTerms>
        <cbc:PaymentDueDate>{invoice['due_date']}</cbc:PaymentDueDate>
    </cac:PaymentTerms>
    
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="TRY">{invoice['tax_amount']:.2f}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="TRY">{invoice['subtotal']:.2f}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="TRY">{invoice['tax_amount']:.2f}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:TaxExemptionReasonCode/>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="TRY">{invoice['subtotal']:.2f}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="TRY">{invoice['subtotal']:.2f}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="TRY">{invoice['total']:.2f}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="TRY">{invoice['total']:.2f}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
'''
    
    for idx, item in enumerate(invoice['items'], 1):
        xml_content += f'''    <cac:InvoiceLine>
        <cbc:ID>{idx}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="KGM">{item['quantity']}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="TRY">{item['total']:.2f}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Name>{item['product_name']}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="TRY">{item['unit_price']:.2f}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
'''
    
    xml_content += '</Invoice>'
    
    return StreamingResponse(
        io.BytesIO(xml_content.encode('utf-8')),
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename=efatura_{invoice['invoice_number']}.xml"}
    )

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "KasaBurger API v1.0", "status": "active"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== PDF & EXCEL EXPORT ROUTES ====================

@api_router.get("/invoices/{invoice_id}/pdf")
async def get_invoice_pdf(invoice_id: str, current_user: dict = Depends(get_current_user)):
    if not reportlab_available:
        raise HTTPException(status_code=503, detail="PDF export not available")
    
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=24, textColor=colors.HexColor('#f97316'))
    elements.append(Paragraph("KASABURGER", title_style))
    elements.append(Paragraph("Burger Koftesi Imalathanesi", styles['Normal']))
    elements.append(Spacer(1, 10*mm))
    
    # Invoice Info
    elements.append(Paragraph(f"<b>Fatura No:</b> {invoice['invoice_number']}", styles['Normal']))
    elements.append(Paragraph(f"<b>Tarih:</b> {invoice['created_at'][:10]}", styles['Normal']))
    elements.append(Paragraph(f"<b>Vade:</b> {invoice['due_date']}", styles['Normal']))
    elements.append(Paragraph(f"<b>Durum:</b> {'Odendi' if invoice['status'] == 'paid' else 'Odenmedi'}", styles['Normal']))
    elements.append(Spacer(1, 5*mm))
    
    # Customer
    elements.append(Paragraph(f"<b>Bayi:</b> {invoice['dealer_name']}", styles['Normal']))
    elements.append(Spacer(1, 10*mm))
    
    # Items Table
    table_data = [['Urun', 'Miktar', 'Birim Fiyat', 'Toplam']]
    for item in invoice['items']:
        table_data.append([
            item['product_name'],
            str(item['quantity']),
            f"{item['unit_price']:.2f} TL",
            f"{item['total']:.2f} TL"
        ])
    
    table = Table(table_data, colWidths=[80*mm, 25*mm, 35*mm, 35*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#1a1a1a')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#333333')),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 5*mm))
    
    # Totals
    elements.append(Paragraph(f"<b>Ara Toplam:</b> {invoice['subtotal']:.2f} TL", styles['Normal']))
    elements.append(Paragraph(f"<b>KDV (%{invoice['tax_rate']}):</b> {invoice['tax_amount']:.2f} TL", styles['Normal']))
    elements.append(Paragraph(f"<b>GENEL TOPLAM:</b> {invoice['total']:.2f} TL", styles['Heading2']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=fatura_{invoice['invoice_number']}.pdf"}
    )

@api_router.get("/reports/excel")
async def export_reports_excel(report_type: str = "all", current_user: dict = Depends(get_current_user)):
    wb = Workbook()
    
    # Style definitions
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="F97316", end_color="F97316", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    if report_type in ["all", "orders"]:
        ws_orders = wb.active if report_type == "orders" else wb.create_sheet("Siparisler")
        ws_orders.title = "Siparisler"
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
        
        headers = ["Siparis No", "Bayi", "Toplam", "Durum", "Teslimat Tarihi", "Olusturma Tarihi"]
        ws_orders.append(headers)
        for col in range(1, len(headers) + 1):
            cell = ws_orders.cell(row=1, column=col)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = thin_border
        
        for order in orders:
            ws_orders.append([
                order.get('order_number', ''),
                order.get('dealer_name', ''),
                order.get('total', 0),
                order.get('status', ''),
                order.get('delivery_date', ''),
                order.get('created_at', '')[:10] if order.get('created_at') else ''
            ])
    
    if report_type in ["all", "invoices"]:
        ws_invoices = wb.create_sheet("Faturalar") if report_type == "all" else wb.active
        if report_type != "all":
            ws_invoices.title = "Faturalar"
        invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
        
        headers = ["Fatura No", "Bayi", "Ara Toplam", "KDV", "Toplam", "Durum", "Vade"]
        ws_invoices.append(headers)
        for col in range(1, len(headers) + 1):
            cell = ws_invoices.cell(row=1, column=col)
            cell.font = header_font
            cell.fill = header_fill
        
        for inv in invoices:
            ws_invoices.append([
                inv.get('invoice_number', ''),
                inv.get('dealer_name', ''),
                inv.get('subtotal', 0),
                inv.get('tax_amount', 0),
                inv.get('total', 0),
                inv.get('status', ''),
                inv.get('due_date', '')
            ])
    
    if report_type in ["all", "transactions"]:
        ws_trans = wb.create_sheet("Muhasebe") if report_type == "all" else wb.active
        if report_type != "all":
            ws_trans.title = "Muhasebe"
        transactions = await db.transactions.find({}, {"_id": 0}).to_list(1000)
        
        headers = ["Tarih", "Tip", "Kategori", "Tutar", "Aciklama"]
        ws_trans.append(headers)
        for col in range(1, len(headers) + 1):
            cell = ws_trans.cell(row=1, column=col)
            cell.font = header_font
            cell.fill = header_fill
        
        for trans in transactions:
            ws_trans.append([
                trans.get('created_at', '')[:10] if trans.get('created_at') else '',
                'Gelir' if trans.get('type') == 'income' else 'Gider',
                trans.get('category', ''),
                trans.get('amount', 0),
                trans.get('description', '')
            ])
    
    if report_type in ["all", "stock"]:
        ws_stock = wb.create_sheet("Stok") if report_type == "all" else wb.active
        if report_type != "all":
            ws_stock.title = "Stok"
        materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
        
        headers = ["Kod", "Hammadde", "Stok", "Min Stok", "Birim", "Birim Fiyat"]
        ws_stock.append(headers)
        for col in range(1, len(headers) + 1):
            cell = ws_stock.cell(row=1, column=col)
            cell.font = header_font
            cell.fill = header_fill
        
        for mat in materials:
            ws_stock.append([
                mat.get('code', ''),
                mat.get('name', ''),
                mat.get('stock_quantity', 0),
                mat.get('min_stock', 0),
                mat.get('unit', ''),
                mat.get('unit_price', 0)
            ])
    
    # Remove default empty sheet if exists
    if "Sheet" in wb.sheetnames and len(wb.sheetnames) > 1:
        del wb["Sheet"]
    
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=kasaburger_rapor_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

# Include router
app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
