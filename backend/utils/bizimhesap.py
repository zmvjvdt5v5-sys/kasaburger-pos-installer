"""BizimHesap API Entegrasyonu - Fatura Gönderimi"""
import os
import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# BizimHesap API Ayarları
BIZIMHESAP_API_KEY = os.environ.get("BIZIMHESAP_API_KEY", "")
BIZIMHESAP_API_URL = os.environ.get("BIZIMHESAP_API_URL", "https://bizimhesap.com/api/b2b")


async def send_invoice_to_bizimhesap(invoice: dict, order: dict, dealer: Optional[dict] = None) -> dict:
    """
    Faturayı BizimHesap'a gönderir
    
    Args:
        invoice: Fatura bilgileri
        order: Sipariş bilgileri
        dealer: Bayi bilgileri (opsiyonel)
    
    Returns:
        dict: {status, guid, url, message}
    """
    if not BIZIMHESAP_API_KEY:
        logger.warning("BIZIMHESAP_API_KEY tanımlı değil, fatura gönderilmedi")
        return {"status": "skipped", "message": "API key not configured"}
    
    try:
        now = datetime.now(timezone.utc)
        due_date = now + timedelta(days=30)
        
        # Ürün detayları
        details = []
        for item in invoice.get("items", []):
            unit_price = float(item.get("unit_price", 0))
            quantity = int(item.get("quantity", 1))
            gross = unit_price * quantity
            tax_rate = 20.0  # KDV oranı %20
            net = gross
            tax = net * (tax_rate / 100)
            total = net + tax
            
            details.append({
                "productId": item.get("product_id", ""),
                "productName": item.get("product_name", "Ürün"),
                "note": "",
                "barcode": "",
                "taxRate": f"{tax_rate:.2f}",
                "quantity": quantity,
                "unitPrice": f"{unit_price:.2f}",
                "grossPrice": f"{gross:.2f}",
                "discount": "0.00",
                "net": f"{net:.2f}",
                "tax": f"{tax:.2f}",
                "total": f"{total:.2f}"
            })
        
        # Müşteri bilgileri
        customer = {
            "customerId": "",
            "title": invoice.get("dealer_name", ""),
            "taxOffice": "",
            "taxNo": "",
            "email": "",
            "phone": "",
            "address": ""
        }
        
        if dealer:
            customer = {
                "customerId": dealer.get("id", ""),
                "title": dealer.get("name", invoice.get("dealer_name", "")),
                "taxOffice": dealer.get("tax_office", ""),
                "taxNo": dealer.get("tax_number", ""),
                "email": dealer.get("email", ""),
                "phone": dealer.get("phone", ""),
                "address": dealer.get("address", "")
            }
        
        # API payload
        payload = {
            "firmId": BIZIMHESAP_API_KEY,
            "invoiceNo": invoice.get("invoice_number", ""),
            "invoiceType": 3,  # 3 = Satış faturası
            "note": f"Sipariş No: {order.get('order_number', '')}",
            "dates": {
                "invoiceDate": now.strftime("%Y-%m-%dT%H:%M:%S.000+03:00"),
                "dueDate": due_date.strftime("%Y-%m-%dT%H:%M:%S.000+03:00"),
                "deliveryDate": now.strftime("%Y-%m-%dT%H:%M:%S.000+03:00")
            },
            "customer": customer,
            "amounts": {
                "currency": "TL",
                "gross": f"{invoice.get('subtotal', 0):.2f}",
                "discount": "0.00",
                "net": f"{invoice.get('subtotal', 0):.2f}",
                "tax": f"{invoice.get('tax_amount', 0):.2f}",
                "total": f"{invoice.get('total', 0):.2f}"
            },
            "details": details
        }
        
        logger.info(f"BizimHesap'a fatura gönderiliyor: {invoice.get('invoice_number')}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BIZIMHESAP_API_URL}/addinvoice",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            result = response.json()
            
            if result.get("guid"):
                logger.info(f"Fatura başarıyla gönderildi: {result['guid']}")
                return {
                    "status": "success",
                    "guid": result["guid"],
                    "url": result.get("url", ""),
                    "message": "Fatura BizimHesap'a gönderildi"
                }
            else:
                error_msg = result.get("error", result.get("message", "Bilinmeyen hata"))
                logger.error(f"BizimHesap hatası: {error_msg}")
                return {
                    "status": "error",
                    "message": error_msg
                }
                
    except Exception as e:
        logger.error(f"BizimHesap API hatası: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }
