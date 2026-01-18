"""E-Fatura Models - GİB Elektronik Fatura"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class InvoiceType(str, Enum):
    SATIS = "SATIS"  # Satış Faturası
    IADE = "IADE"    # İade Faturası
    TEVKIFAT = "TEVKIFAT"  # Tevkifatlı Fatura
    ISTISNA = "ISTISNA"    # İstisna Faturası
    OZELMATRAH = "OZELMATRAH"  # Özel Matrah
    IHRAC = "IHRAC"  # İhraç Kayıtlı

class InvoiceScenario(str, Enum):
    TEMELFATURA = "TEMELFATURA"
    TICARIFATURA = "TICARIFATURA"
    YOLCUBERABERFATURA = "YOLCUBERABERFATURA"
    IHRACAT = "IHRACAT"

class DocumentType(str, Enum):
    E_FATURA = "E_FATURA"      # e-Fatura (GİB kayıtlı firmalar arası)
    E_ARSIV = "E_ARSIV"        # e-Arşiv (Bireysel müşteriler)
    E_IRSALIYE = "E_IRSALIYE"  # e-İrsaliye
    E_MUSTHSTB = "E_MUSTHSTB"  # e-Müstahsil Makbuzu

class TaxType(str, Enum):
    KDV = "0015"      # KDV
    OTV = "0071"      # ÖTV
    STOPAJ = "0003"   # Stopaj

class InvoiceLineItem(BaseModel):
    name: str
    quantity: float
    unit: str = "ADET"  # ADET, KG, LT, MT, M2, M3
    unit_price: float
    vat_rate: float = 10  # KDV oranı (0, 1, 10, 20)
    discount_rate: Optional[float] = 0
    discount_amount: Optional[float] = 0

class CustomerInfo(BaseModel):
    # Kurumsal
    tax_number: Optional[str] = None  # VKN (10 hane)
    tax_office: Optional[str] = None  # Vergi Dairesi
    company_name: Optional[str] = None
    # Bireysel
    tc_number: Optional[str] = None   # TCKN (11 hane)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    # Ortak
    address: str
    city: str
    district: Optional[str] = None
    country: str = "Türkiye"
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class EInvoiceCreate(BaseModel):
    # Fatura bilgileri
    invoice_type: InvoiceType = InvoiceType.SATIS
    scenario: InvoiceScenario = InvoiceScenario.TEMELFATURA
    document_type: DocumentType = DocumentType.E_ARSIV
    currency: str = "TRY"
    exchange_rate: Optional[float] = 1.0
    
    # Müşteri bilgileri
    customer: CustomerInfo
    
    # Kalemler
    items: List[InvoiceLineItem]
    
    # Ek bilgiler
    notes: Optional[str] = None
    order_number: Optional[str] = None  # Sipariş numarası
    dispatch_number: Optional[str] = None  # İrsaliye numarası
    payment_terms: Optional[str] = None  # Ödeme koşulları

class EInvoiceResponse(BaseModel):
    id: str
    invoice_number: str  # GIB2024000000001 formatı
    uuid: str  # ETTN (e-Fatura Tekil Numarası)
    invoice_type: str
    document_type: str
    customer_name: str
    customer_tax_number: Optional[str] = None
    subtotal: float
    vat_total: float
    total: float
    currency: str
    status: str  # draft, sent, approved, rejected, cancelled
    gib_response: Optional[dict] = None
    pdf_url: Optional[str] = None
    xml_url: Optional[str] = None
    created_at: str
    sent_at: Optional[str] = None

class EInvoiceSettings(BaseModel):
    # Entegratör bilgileri
    integrator: str = "manual"  # manual, nes, izibiz, logo, foriba
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    
    # GİB bilgileri
    gib_user: Optional[str] = None
    gib_password: Optional[str] = None
    sender_alias: Optional[str] = None  # PK/GB kodu
    
    # Firma bilgileri
    company_name: str
    tax_number: str  # VKN
    tax_office: str  # Vergi Dairesi
    address: str
    city: str
    phone: Optional[str] = None
    email: Optional[str] = None
    
    # Fatura serisi
    invoice_series: str = "GIB"
    last_invoice_number: int = 0
    
    # Otomatik ayarlar
    auto_send: bool = False
    default_vat_rate: float = 10
