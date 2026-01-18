"""E-Fatura Router - GİB Elektronik Fatura Entegrasyonu"""
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import base64
import hashlib

from models.einvoice import (
    EInvoiceCreate, EInvoiceResponse, EInvoiceSettings,
    InvoiceType, DocumentType, InvoiceScenario
)
from utils.auth import get_current_user
from utils.database import get_db

router = APIRouter(prefix="/einvoice", tags=["E-Fatura"])

# ==================== AYARLAR ====================

@router.get("/settings")
async def get_einvoice_settings(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        return {"integrator": "manual", "configured": False}
    
    settings = await db.settings.find_one({"type": "einvoice"}, {"_id": 0})
    if not settings:
        return {"integrator": "manual", "configured": False}
    
    # API anahtarlarını gizle
    if settings.get("api_secret"):
        settings["api_secret"] = "***"
    if settings.get("gib_password"):
        settings["gib_password"] = "***"
    
    settings["configured"] = True
    return settings

@router.post("/settings")
async def save_einvoice_settings(settings: EInvoiceSettings, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    settings_doc = {
        "type": "einvoice",
        **settings.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": current_user.get("user_id")
    }
    
    await db.settings.update_one(
        {"type": "einvoice"},
        {"$set": settings_doc},
        upsert=True
    )
    
    return {"success": True, "message": "E-Fatura ayarları kaydedildi"}

# ==================== FATURA OLUŞTURMA ====================

def generate_invoice_number(series: str, number: int) -> str:
    """GİB formatında fatura numarası oluştur: ABC2024000000001"""
    year = datetime.now().year
    return f"{series}{year}{str(number).zfill(9)}"

def generate_ettn() -> str:
    """ETTN (e-Fatura Tekil Numarası) oluştur - UUID v4 formatında"""
    return str(uuid.uuid4())

def calculate_invoice_totals(items: list) -> dict:
    """Fatura toplamlarını hesapla"""
    subtotal = 0
    vat_total = 0
    
    for item in items:
        line_total = item.quantity * item.unit_price
        discount = item.discount_amount or (line_total * (item.discount_rate or 0) / 100)
        line_net = line_total - discount
        line_vat = line_net * item.vat_rate / 100
        
        subtotal += line_net
        vat_total += line_vat
    
    return {
        "subtotal": round(subtotal, 2),
        "vat_total": round(vat_total, 2),
        "total": round(subtotal + vat_total, 2)
    }

def generate_ubl_xml(invoice_data: dict, settings: dict) -> str:
    """UBL-TR formatında XML oluştur"""
    
    # XML namespace'ler
    namespaces = {
        "": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
        "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
        "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
    }
    
    # Root element
    root = ET.Element("Invoice", xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2")
    root.set("xmlns:cac", namespaces["cac"])
    root.set("xmlns:cbc", namespaces["cbc"])
    
    # UBL Version
    ET.SubElement(root, "{%s}UBLVersionID" % namespaces["cbc"]).text = "2.1"
    ET.SubElement(root, "{%s}CustomizationID" % namespaces["cbc"]).text = "TR1.2"
    ET.SubElement(root, "{%s}ProfileID" % namespaces["cbc"]).text = invoice_data.get("scenario", "TEMELFATURA")
    
    # Fatura bilgileri
    ET.SubElement(root, "{%s}ID" % namespaces["cbc"]).text = invoice_data["invoice_number"]
    ET.SubElement(root, "{%s}CopyIndicator" % namespaces["cbc"]).text = "false"
    ET.SubElement(root, "{%s}UUID" % namespaces["cbc"]).text = invoice_data["uuid"]
    ET.SubElement(root, "{%s}IssueDate" % namespaces["cbc"]).text = datetime.now().strftime("%Y-%m-%d")
    ET.SubElement(root, "{%s}IssueTime" % namespaces["cbc"]).text = datetime.now().strftime("%H:%M:%S")
    ET.SubElement(root, "{%s}InvoiceTypeCode" % namespaces["cbc"]).text = invoice_data.get("invoice_type", "SATIS")
    ET.SubElement(root, "{%s}DocumentCurrencyCode" % namespaces["cbc"]).text = invoice_data.get("currency", "TRY")
    
    # Satıcı bilgileri (AccountingSupplierParty)
    supplier = ET.SubElement(root, "{%s}AccountingSupplierParty" % namespaces["cac"])
    supplier_party = ET.SubElement(supplier, "{%s}Party" % namespaces["cac"])
    
    supplier_id = ET.SubElement(supplier_party, "{%s}PartyIdentification" % namespaces["cac"])
    ET.SubElement(supplier_id, "{%s}ID" % namespaces["cbc"], schemeID="VKN").text = settings.get("tax_number", "")
    
    supplier_name = ET.SubElement(supplier_party, "{%s}PartyName" % namespaces["cac"])
    ET.SubElement(supplier_name, "{%s}Name" % namespaces["cbc"]).text = settings.get("company_name", "")
    
    # Alıcı bilgileri (AccountingCustomerParty)
    customer = invoice_data.get("customer", {})
    customer_elem = ET.SubElement(root, "{%s}AccountingCustomerParty" % namespaces["cac"])
    customer_party = ET.SubElement(customer_elem, "{%s}Party" % namespaces["cac"])
    
    if customer.get("tax_number"):
        customer_id = ET.SubElement(customer_party, "{%s}PartyIdentification" % namespaces["cac"])
        ET.SubElement(customer_id, "{%s}ID" % namespaces["cbc"], schemeID="VKN").text = customer["tax_number"]
    elif customer.get("tc_number"):
        customer_id = ET.SubElement(customer_party, "{%s}PartyIdentification" % namespaces["cac"])
        ET.SubElement(customer_id, "{%s}ID" % namespaces["cbc"], schemeID="TCKN").text = customer["tc_number"]
    
    # Fatura kalemleri
    for i, item in enumerate(invoice_data.get("items", []), 1):
        line = ET.SubElement(root, "{%s}InvoiceLine" % namespaces["cac"])
        ET.SubElement(line, "{%s}ID" % namespaces["cbc"]).text = str(i)
        
        quantity = ET.SubElement(line, "{%s}InvoicedQuantity" % namespaces["cbc"])
        quantity.text = str(item.get("quantity", 1))
        quantity.set("unitCode", item.get("unit", "C62"))
        
        line_amount = ET.SubElement(line, "{%s}LineExtensionAmount" % namespaces["cbc"])
        line_amount.text = str(item.get("quantity", 1) * item.get("unit_price", 0))
        line_amount.set("currencyID", invoice_data.get("currency", "TRY"))
        
        # Ürün bilgisi
        item_elem = ET.SubElement(line, "{%s}Item" % namespaces["cac"])
        ET.SubElement(item_elem, "{%s}Name" % namespaces["cbc"]).text = item.get("name", "")
        
        # Birim fiyat
        price = ET.SubElement(line, "{%s}Price" % namespaces["cac"])
        price_amount = ET.SubElement(price, "{%s}PriceAmount" % namespaces["cbc"])
        price_amount.text = str(item.get("unit_price", 0))
        price_amount.set("currencyID", invoice_data.get("currency", "TRY"))
    
    # Toplamlar
    totals = invoice_data.get("totals", {})
    
    tax_total = ET.SubElement(root, "{%s}TaxTotal" % namespaces["cac"])
    tax_amount = ET.SubElement(tax_total, "{%s}TaxAmount" % namespaces["cbc"])
    tax_amount.text = str(totals.get("vat_total", 0))
    tax_amount.set("currencyID", invoice_data.get("currency", "TRY"))
    
    legal_total = ET.SubElement(root, "{%s}LegalMonetaryTotal" % namespaces["cac"])
    
    line_ext = ET.SubElement(legal_total, "{%s}LineExtensionAmount" % namespaces["cbc"])
    line_ext.text = str(totals.get("subtotal", 0))
    line_ext.set("currencyID", invoice_data.get("currency", "TRY"))
    
    tax_exc = ET.SubElement(legal_total, "{%s}TaxExclusiveAmount" % namespaces["cbc"])
    tax_exc.text = str(totals.get("subtotal", 0))
    tax_exc.set("currencyID", invoice_data.get("currency", "TRY"))
    
    tax_inc = ET.SubElement(legal_total, "{%s}TaxInclusiveAmount" % namespaces["cbc"])
    tax_inc.text = str(totals.get("total", 0))
    tax_inc.set("currencyID", invoice_data.get("currency", "TRY"))
    
    payable = ET.SubElement(legal_total, "{%s}PayableAmount" % namespaces["cbc"])
    payable.text = str(totals.get("total", 0))
    payable.set("currencyID", invoice_data.get("currency", "TRY"))
    
    return ET.tostring(root, encoding="unicode", xml_declaration=True)

@router.post("/create", response_model=EInvoiceResponse)
async def create_einvoice(invoice: EInvoiceCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # Ayarları al
    settings = await db.settings.find_one({"type": "einvoice"}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="E-Fatura ayarları yapılandırılmamış")
    
    # Fatura numarası oluştur
    last_number = settings.get("last_invoice_number", 0) + 1
    invoice_number = generate_invoice_number(settings.get("invoice_series", "GIB"), last_number)
    ettn = generate_ettn()
    
    # Toplamları hesapla
    items_data = [item.model_dump() for item in invoice.items]
    totals = calculate_invoice_totals(invoice.items)
    
    # Müşteri adı
    customer = invoice.customer
    customer_name = customer.company_name or f"{customer.first_name} {customer.last_name}"
    
    # Fatura verisi
    invoice_data = {
        "invoice_number": invoice_number,
        "uuid": ettn,
        "invoice_type": invoice.invoice_type.value,
        "scenario": invoice.scenario.value,
        "document_type": invoice.document_type.value,
        "currency": invoice.currency,
        "customer": customer.model_dump(),
        "items": items_data,
        "totals": totals
    }
    
    # XML oluştur
    xml_content = generate_ubl_xml(invoice_data, settings)
    
    # Veritabanına kaydet
    invoice_doc = {
        "id": str(uuid.uuid4()),
        "invoice_number": invoice_number,
        "uuid": ettn,
        "invoice_type": invoice.invoice_type.value,
        "document_type": invoice.document_type.value,
        "scenario": invoice.scenario.value,
        "customer_name": customer_name,
        "customer_tax_number": customer.tax_number or customer.tc_number,
        "customer_data": customer.model_dump(),
        "items": items_data,
        "subtotal": totals["subtotal"],
        "vat_total": totals["vat_total"],
        "total": totals["total"],
        "currency": invoice.currency,
        "notes": invoice.notes,
        "order_number": invoice.order_number,
        "status": "draft",
        "xml_content": xml_content,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.get("user_id")
    }
    
    await db.einvoices.insert_one(invoice_doc)
    
    # Fatura numarasını güncelle
    await db.settings.update_one(
        {"type": "einvoice"},
        {"$set": {"last_invoice_number": last_number}}
    )
    
    invoice_doc.pop("_id", None)
    invoice_doc.pop("xml_content", None)
    invoice_doc.pop("customer_data", None)
    
    return EInvoiceResponse(**invoice_doc)

# ==================== FATURA LİSTELEME ====================

@router.get("/list")
async def list_einvoices(
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        return []
    
    query = {}
    if status:
        query["status"] = status
    if document_type:
        query["document_type"] = document_type
    
    invoices = await db.einvoices.find(
        query,
        {"_id": 0, "xml_content": 0, "customer_data": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return invoices

@router.get("/{invoice_id}")
async def get_einvoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    invoice = await db.einvoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    return invoice

@router.get("/{invoice_id}/xml")
async def get_einvoice_xml(invoice_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    invoice = await db.einvoices.find_one({"id": invoice_id}, {"_id": 0, "xml_content": 1})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    from fastapi.responses import Response
    return Response(
        content=invoice.get("xml_content", ""),
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename={invoice_id}.xml"}
    )

# ==================== FATURA GÖNDERME ====================

@router.post("/{invoice_id}/send")
async def send_einvoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    invoice = await db.einvoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    if invoice.get("status") != "draft":
        raise HTTPException(status_code=400, detail="Sadece taslak faturalar gönderilebilir")
    
    settings = await db.settings.find_one({"type": "einvoice"}, {"_id": 0})
    integrator = settings.get("integrator", "manual") if settings else "manual"
    
    # Manuel mod - sadece durumu güncelle
    if integrator == "manual":
        await db.einvoices.update_one(
            {"id": invoice_id},
            {"$set": {
                "status": "sent",
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "gib_response": {"message": "Manuel gönderim - GİB portalından yükleyin"}
            }}
        )
        return {
            "success": True,
            "message": "Fatura gönderilmeye hazır. XML dosyasını GİB portalından manuel olarak yükleyin.",
            "xml_download": f"/api/einvoice/{invoice_id}/xml"
        }
    
    # Entegratör API'si ile gönderim (ileride implement edilecek)
    # NES, IZIBIZ, Logo, Foriba vb.
    
    return {
        "success": False,
        "message": f"{integrator} entegrasyonu henüz aktif değil. Manuel gönderim yapın.",
        "xml_download": f"/api/einvoice/{invoice_id}/xml"
    }

# ==================== FATURA İPTAL ====================

@router.post("/{invoice_id}/cancel")
async def cancel_einvoice(invoice_id: str, reason: str = "İptal", current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    invoice = await db.einvoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    if invoice.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Fatura zaten iptal edilmiş")
    
    await db.einvoices.update_one(
        {"id": invoice_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancel_reason": reason
        }}
    )
    
    return {"success": True, "message": "Fatura iptal edildi"}

# ==================== GİB SORGU ====================

@router.get("/gib/check-taxpayer/{tax_number}")
async def check_gib_taxpayer(tax_number: str, current_user: dict = Depends(get_current_user)):
    """Vergi numarasının e-Fatura mükellefi olup olmadığını kontrol et"""
    # GİB web servisinden sorgulanır - şimdilik mock
    return {
        "tax_number": tax_number,
        "is_efatura_user": False,  # Gerçek sorgu sonucu
        "alias_list": [],
        "message": "GİB sorgusu için entegratör API gereklidir"
    }

# ==================== RAPORLAR ====================

@router.get("/reports/summary")
async def get_einvoice_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        return {"total_count": 0, "total_amount": 0, "by_status": {}, "by_type": {}}
    
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    invoices = await db.einvoices.find(query, {"_id": 0}).to_list(10000)
    
    total_count = len(invoices)
    total_amount = sum(inv.get("total", 0) for inv in invoices)
    
    by_status = {}
    by_type = {}
    
    for inv in invoices:
        status = inv.get("status", "unknown")
        doc_type = inv.get("document_type", "unknown")
        
        by_status[status] = by_status.get(status, 0) + 1
        by_type[doc_type] = by_type.get(doc_type, 0) + 1
    
    return {
        "total_count": total_count,
        "total_amount": total_amount,
        "by_status": by_status,
        "by_type": by_type
    }
