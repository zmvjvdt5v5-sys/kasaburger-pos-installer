"""POS Models"""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class POSTableCreate(BaseModel):
    name: str
    capacity: Optional[int] = 4
    section: Optional[str] = "main"

class POSTableResponse(BaseModel):
    id: str
    name: str
    status: str = "empty"
    capacity: int = 4
    section: str = "main"
    current_order_id: Optional[str] = None

class POSOrderItem(BaseModel):
    name: str
    price: float
    quantity: int = 1
    notes: Optional[str] = None

class POSOrderCreate(BaseModel):
    source: str = "table"  # table, takeaway, delivery, yemeksepeti, getir, trendyol, migros
    table_id: Optional[str] = None
    table_number: Optional[int] = None
    items: List[POSOrderItem]
    notes: Optional[str] = None
    total: float = 0
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

class POSOrderResponse(BaseModel):
    id: str
    order_number: str
    source: str
    table_id: Optional[str] = None
    table_number: Optional[int] = None
    items: List[dict]
    status: str = "pending"
    total: float
    notes: Optional[str] = None
    created_at: str
    created_by: Optional[str] = None

class POSPaymentCreate(BaseModel):
    amount: float
    method: str = "cash"  # cash, card, online, sodexo, multinet, ticket, setcard
    tip_amount: Optional[float] = 0

class InPOSConfig(BaseModel):
    enabled: bool = False
    ip_address: str = "192.168.1.100"
    port: int = 59000
    timeout: int = 30
    auto_print: bool = True
    payment_mappings: Optional[Dict[str, int]] = {
        "cash": 1,
        "card": 2,
        "online": 7,
        "sodexo": 3,
        "multinet": 4,
        "ticket": 5,
        "setcard": 6
    }

class InPOSPaymentRequest(BaseModel):
    order_id: str
    amount: float
    payment_method: str
    tip_amount: Optional[float] = 0
    installments: Optional[int] = 1

class InPOSFiscalRequest(BaseModel):
    order_id: str
    items: List[Dict]
    payments: List[Dict]
    customer_info: Optional[Dict] = None
