"""Dealer Models"""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class DealerPricing(BaseModel):
    product_id: str
    dealer_price: float

class DealerCreate(BaseModel):
    code: str
    name: str
    email: str
    phone: str
    address: str
    password: str
    tax_number: Optional[str] = None
    pricing: Optional[List[DealerPricing]] = []
    credit_limit: float = 0
    payment_term_days: int = 30

class DealerResponse(BaseModel):
    id: str
    code: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    credit_limit: Optional[float] = 0
    current_balance: Optional[float] = 0
    balance: Optional[float] = 0
    status: Optional[str] = "active"
    payment_term_days: Optional[int] = 30
    created_at: Optional[str] = None

class DealerLogin(BaseModel):
    code: str
    password: str

class DealerOrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float

class DealerOrderCreate(BaseModel):
    items: List[DealerOrderItem]
    notes: Optional[str] = None
    shipping_address: Optional[str] = None
