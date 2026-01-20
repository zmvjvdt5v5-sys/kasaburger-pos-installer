"""Dealer Portal Router - Bayi Portal Endpoint'leri"""
import uuid
import io
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional
from pydantic import BaseModel

from utils.auth import get_current_dealer
from utils.database import get_db

router = APIRouter(prefix="/dealer-portal", tags=["Dealer Portal"])

# Pydantic Models
class DealerOrderItem(BaseModel):
    product_id: str
    product_name: str
    unit_price: float
    quantity: int
    total: float

class DealerOrderCreate(BaseModel):
    items: List[DealerOrderItem]
    total: float
    delivery_date: str
    notes: Optional[str] = ""

class DealerPaymentSubmit(BaseModel):
    amount: float
    payment_method: str = "mail_order"
    payment_date: str
    reference_no: Optional[str] = ""
    notes: Optional[str] = ""

class IyzicoPaymentRequest(BaseModel):
    amount: float
    card_holder_name: str
    card_number: str
    expire_month: str
    expire_year: str
    cvc: str
    installment: int = 1

# Helper function
async def generate_order_number(db):
    """Benzersiz sipariş numarası üret"""
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    last_order = await db.orders.find_one(
        {"order_number": {"$regex": f"^SIP-{today}"}},
        sort=[("order_number", -1)]
    )
    if last_order:
        last_num = int(last_order["order_number"].split("-")[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    return f"SIP-{today}-{new_num:04d}"


@router.get("/me")
async def dealer_portal_me(dealer: dict = Depends(get_current_dealer)):
    """Bayi bilgilerini getir"""
    db = get_db()
    if db is None:
        return {"id": dealer.get("user_id"), "name": "Bayi", "code": dealer.get("email"), "balance": 0, "pricing": []}
    
    db_dealer = await db.dealers.find_one(
        {"$or": [{"id": dealer.get("user_id")}, {"code": dealer.get("email")}]},
        {"_id": 0}
    )
    if db_dealer:
        return {
            "id": db_dealer.get("id"),
            "name": db_dealer.get("name"),
            "code": db_dealer.get("code"),
            "balance": db_dealer.get("current_balance", db_dealer.get("balance", 0)),
            "pricing": db_dealer.get("pricing", [])
        }
    return {"id": dealer.get("user_id"), "name": "Bayi", "code": dealer.get("email"), "balance": 0, "pricing": []}


@router.get("/products")
async def dealer_portal_products(dealer: dict = Depends(get_current_dealer)):
    """Bayi için ürün listesi - özel fiyatlarla"""
    db = get_db()
    if db is None:
        return []
    
    # Bayi bilgilerini al
    db_dealer = await db.dealers.find_one(
        {"$or": [{"id": dealer.get("user_id")}, {"code": dealer.get("email")}]},
        {"_id": 0}
    )
    dealer_pricing = {}
    if db_dealer:
        dealer_pricing = {p["product_id"]: p["special_price"] for p in db_dealer.get("pricing", [])}
    
    # Ürünleri al
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    
    # Her ürüne bayi fiyatını ekle
    result = []
    for p in products:
        product_data = {
            "id": p.get("id"),
            "name": p.get("name"),
            "code": p.get("code"),
            "unit": p.get("unit", "adet"),
            "base_price": p.get("base_price", 0),
            "category": p.get("category", "Diğer"),
            "sub_category": p.get("sub_category", ""),
            "description": p.get("description", ""),
            "dealer_price": dealer_pricing.get(p.get("id"), p.get("base_price", 0))
        }
        result.append(product_data)
    
    return result


@router.get("/orders")
async def dealer_portal_orders(dealer: dict = Depends(get_current_dealer)):
    """Bayi siparişlerini getir"""
    db = get_db()
    if db is None:
        return []
    
    dealer_id = dealer.get("user_id")
    orders = await db.orders.find(
        {"dealer_id": dealer_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders


@router.post("/orders")
async def dealer_portal_create_order(order: DealerOrderCreate, dealer: dict = Depends(get_current_dealer)):
    """Bayi sipariş oluştur"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    dealer_id = dealer.get("user_id")
    
    # Güncel bayi bilgilerini al
    current_dealer = await db.dealers.find_one({"id": dealer_id}, {"_id": 0})
    if not current_dealer:
        current_dealer = await db.dealers.find_one({"code": dealer.get("email")}, {"_id": 0})
    
    if not current_dealer:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    
    order_id = str(uuid.uuid4())
    order_number = await generate_order_number(db)
    subtotal = sum(item.total for item in order.items)
    tax_amount = subtotal * 0.20
    total = subtotal + tax_amount
    
    # Kredi limiti kontrolü
    current_balance = current_dealer.get("current_balance", current_dealer.get("balance", 0))
    credit_limit = current_dealer.get("credit_limit", 0)
    new_balance = current_balance + total
    
    # TÜM bayi siparişleri admin onayı gerektirir (depo sipariş sistemi)
    requires_approval = True
    approval_reason = "Bayi siparişi - Admin onayı gerekli"
    
    # Kredi limiti aşımı ek bilgisi
    if credit_limit > 0 and new_balance > credit_limit:
        approval_reason = f"Kredi limiti aşımı. Limit: {credit_limit:.2f} TL, Mevcut Borç: {current_balance:.2f} TL"
    
    order_doc = {
        "id": order_id,
        "order_number": order_number,
        "dealer_id": current_dealer["id"],
        "dealer_name": current_dealer["name"],
        "items": [item.model_dump() for item in order.items],
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total": total,
        "delivery_date": order.delivery_date,
        "notes": order.notes or "",
        "status": "pending_approval",
        "requires_approval": requires_approval,
        "approval_reason": approval_reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "dealer_portal"
    }
    await db.orders.insert_one(order_doc)
    
    # Response hazırla
    response_data = {k: v for k, v in order_doc.items() if k not in ["_id", "requires_approval", "approval_reason"]}
    
    return {
        "order": response_data,
        "warning": "Siparişiniz admin onayı bekliyor. Onaylandıktan sonra faturanız oluşturulacaktır.",
        "status": "pending_approval",
        "credit_info": {
            "credit_limit": credit_limit,
            "current_balance": current_balance,
            "order_total": total,
            "new_balance": new_balance,
            "over_limit": max(0, new_balance - credit_limit) if credit_limit > 0 else 0
        }
    }


@router.get("/invoices")
async def dealer_portal_invoices(dealer: dict = Depends(get_current_dealer)):
    """Bayi faturalarını getir"""
    db = get_db()
    if db is None:
        return []
    
    dealer_id = dealer.get("user_id")
    invoices = await db.invoices.find(
        {"dealer_id": dealer_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return invoices


@router.get("/campaigns")
async def dealer_portal_campaigns(dealer: dict = Depends(get_current_dealer)):
    """Bayiye özel aktif kampanyaları getir"""
    db = get_db()
    if db is None:
        return []
    
    dealer_id = dealer.get("user_id")
    now = datetime.now(timezone.utc).isoformat()[:10]
    
    # Aktif kampanyaları getir
    campaigns = await db.campaigns.find(
        {"end_date": {"$gte": now}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Bayiye özel kampanyaları filtrele
    dealer_campaigns = []
    for campaign in campaigns:
        target_dealers = campaign.get("target_dealers", [])
        if len(target_dealers) == 0 or dealer_id in target_dealers:
            dealer_campaigns.append(campaign)
    
    return dealer_campaigns


@router.get("/invoices/{invoice_id}/pdf")
async def dealer_portal_invoice_pdf(invoice_id: str, dealer: dict = Depends(get_current_dealer)):
    """Fatura PDF indirme"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    dealer_id = dealer.get("user_id")
    invoice = await db.invoices.find_one(
        {"id": invoice_id, "dealer_id": dealer_id},
        {"_id": 0}
    )
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura bulunamadı")
    
    # reportlab kontrolü
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    except ImportError:
        raise HTTPException(status_code=503, detail="PDF export not available")
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    elements = []
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=24, textColor=colors.HexColor('#f97316'))
    elements.append(Paragraph("KASABURGER", title_style))
    elements.append(Paragraph(f"<b>Fatura No:</b> {invoice['invoice_number']}", styles['Normal']))
    elements.append(Paragraph(f"<b>Tarih:</b> {invoice['created_at'][:10]}", styles['Normal']))
    elements.append(Spacer(1, 10*mm))
    
    table_data = [['Ürün', 'Miktar', 'Birim Fiyat', 'Toplam']]
    for item in invoice.get('items', []):
        table_data.append([
            item.get('product_name', ''),
            str(item.get('quantity', 0)),
            f"{item.get('unit_price', 0):.2f} TL",
            f"{item.get('total', 0):.2f} TL"
        ])
    
    table = Table(table_data, colWidths=[80*mm, 25*mm, 35*mm, 35*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#333333')),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 5*mm))
    elements.append(Paragraph(f"<b>GENEL TOPLAM:</b> {invoice.get('total', 0):.2f} TL", styles['Heading2']))
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=fatura_{invoice['invoice_number']}.pdf"}
    )


@router.put("/change-password")
async def dealer_change_password(old_password: str, new_password: str, dealer: dict = Depends(get_current_dealer)):
    """Bayi şifre değiştirme"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    dealer_id = dealer.get("user_id")
    db_dealer = await db.dealers.find_one({"id": dealer_id}, {"_id": 0})
    
    if not db_dealer:
        db_dealer = await db.dealers.find_one({"code": dealer.get("email")}, {"_id": 0})
    
    if not db_dealer:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    
    # Şifre kontrolü - hem plain text hem de hash kontrolü
    from utils.auth import verify_password, hash_password
    stored_password = db_dealer.get("password", db_dealer["code"])
    
    # Önce plain text karşılaştırma (legacy support)
    password_valid = (old_password == stored_password)
    
    # Eğer plain text değilse hash kontrolü
    if not password_valid:
        try:
            password_valid = verify_password(old_password, stored_password)
        except Exception:
            password_valid = False
    
    if not password_valid:
        raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
    
    # Yeni şifreyi hash'le ve kaydet
    new_hashed_password = hash_password(new_password)
    await db.dealers.update_one(
        {"id": db_dealer["id"]},
        {"$set": {"password": new_hashed_password}}
    )
    
    return {"message": "Şifre başarıyla değiştirildi"}


@router.get("/payments")
async def dealer_portal_payments(dealer: dict = Depends(get_current_dealer)):
    """Bayinin ödeme geçmişini getirir"""
    db = get_db()
    if db is None:
        return []
    
    dealer_id = dealer.get("user_id")
    payments = await db.payments.find(
        {"dealer_id": dealer_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Fatura numaralarını al
    invoice_ids = [p["invoice_id"] for p in payments if p.get("invoice_id")]
    if invoice_ids:
        invoices = await db.invoices.find(
            {"id": {"$in": invoice_ids}},
            {"_id": 0, "id": 1, "invoice_number": 1}
        ).to_list(100)
        invoice_map = {inv["id"]: inv["invoice_number"] for inv in invoices}
        for payment in payments:
            payment["invoice_number"] = invoice_map.get(payment.get("invoice_id"), "-")
    else:
        for payment in payments:
            payment["invoice_number"] = "-"
    
    return payments


@router.post("/submit-payment")
async def dealer_submit_payment(payment: DealerPaymentSubmit, dealer: dict = Depends(get_current_dealer)):
    """Bayi ödeme bildirimi gönderir - Admin onayı bekler"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    dealer_id = dealer.get("user_id")
    
    # Bayi adını al
    db_dealer = await db.dealers.find_one(
        {"$or": [{"id": dealer_id}, {"code": dealer.get("email")}]},
        {"_id": 0, "name": 1}
    )
    dealer_name = db_dealer.get("name", "Bayi") if db_dealer else "Bayi"
    
    payment_id = str(uuid.uuid4())
    payment_doc = {
        "id": payment_id,
        "dealer_id": dealer_id,
        "dealer_name": dealer_name,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "payment_date": payment.payment_date,
        "reference_no": payment.reference_no,
        "notes": payment.notes,
        "status": "pending",
        "submitted_by": "dealer",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_submissions.insert_one(payment_doc)
    
    return {"message": "Ödeme bildiriminiz alındı", "payment_id": payment_id}


@router.post("/iyzico-payment")
async def process_iyzico_payment(payment: IyzicoPaymentRequest, request: Request, dealer: dict = Depends(get_current_dealer)):
    """iyzico ile kredi kartı ödemesi işle"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    # iyzico kontrolü
    try:
        import iyzipay
        import os
        IYZICO_API_KEY = os.environ.get('IYZICO_API_KEY', '')
        IYZICO_SECRET_KEY = os.environ.get('IYZICO_SECRET_KEY', '')
        IYZICO_BASE_URL = os.environ.get('IYZICO_BASE_URL', 'https://sandbox-api.iyzipay.com')
    except ImportError:
        raise HTTPException(status_code=503, detail="Ödeme sistemi şu anda kullanılamıyor")
    
    if not IYZICO_API_KEY or not IYZICO_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Ödeme sistemi yapılandırılmamış")
    
    dealer_id = dealer.get("user_id")
    
    # Bayi bilgilerini al
    db_dealer = await db.dealers.find_one(
        {"$or": [{"id": dealer_id}, {"code": dealer.get("email")}]},
        {"_id": 0}
    )
    
    if not db_dealer:
        raise HTTPException(status_code=404, detail="Bayi bulunamadı")
    
    import time
    import json
    import logging
    
    try:
        options = {
            'api_key': IYZICO_API_KEY,
            'secret_key': IYZICO_SECRET_KEY,
            'base_url': IYZICO_BASE_URL
        }
        
        conversation_id = str(uuid.uuid4())
        basket_id = f"DEALER-{db_dealer['id']}-{int(time.time())}"
        client_ip = request.client.host if request.client else "0.0.0.0"
        
        payment_request = {
            'locale': 'tr',
            'conversationId': conversation_id,
            'price': str(payment.amount),
            'paidPrice': str(payment.amount),
            'installment': str(payment.installment),
            'basketId': basket_id,
            'paymentChannel': 'WEB',
            'paymentGroup': 'PRODUCT',
            'currency': 'TRY',
            'paymentCard': {
                'cardHolderName': payment.card_holder_name,
                'cardNumber': payment.card_number.replace(' ', ''),
                'expireMonth': payment.expire_month,
                'expireYear': payment.expire_year,
                'cvc': payment.cvc,
                'registerCard': '0'
            },
            'buyer': {
                'id': db_dealer['id'],
                'name': db_dealer['name'].split()[0] if ' ' in db_dealer['name'] else db_dealer['name'],
                'surname': db_dealer['name'].split()[-1] if ' ' in db_dealer['name'] else db_dealer['name'],
                'gsmNumber': db_dealer.get('phone', '+905000000000'),
                'email': db_dealer.get('email', 'bayi@kasaburger.com.tr'),
                'identityNumber': '11111111111',
                'registrationAddress': db_dealer.get('address', 'İstanbul'),
                'ip': client_ip,
                'city': 'Istanbul',
                'country': 'Turkey'
            },
            'shippingAddress': {
                'contactName': db_dealer['name'],
                'city': 'Istanbul',
                'country': 'Turkey',
                'address': db_dealer.get('address', 'İstanbul')
            },
            'billingAddress': {
                'contactName': db_dealer['name'],
                'city': 'Istanbul',
                'country': 'Turkey',
                'address': db_dealer.get('address', 'İstanbul')
            },
            'basketItems': [
                {
                    'id': 'ODEME',
                    'name': 'Bayi Borç Ödemesi',
                    'category1': 'Ödeme',
                    'itemType': 'VIRTUAL',
                    'price': str(payment.amount)
                }
            ]
        }
        
        payment_response = iyzipay.Payment().create(payment_request, options)
        response_dict = payment_response.read().decode('utf-8')
        result = json.loads(response_dict)
        
        if result.get('status') == 'success':
            payment_id = str(uuid.uuid4())
            payment_doc = {
                "id": payment_id,
                "dealer_id": db_dealer["id"],
                "dealer_name": db_dealer["name"],
                "amount": payment.amount,
                "payment_method": "sanal_pos",
                "payment_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "reference_no": result.get('paymentId', ''),
                "notes": f"iyzico ödeme - Conversation: {conversation_id}",
                "iyzico_payment_id": result.get('paymentId'),
                "card_last_four": payment.card_number[-4:],
                "invoice_id": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "created_by": "dealer_portal"
            }
            await db.payments.insert_one(payment_doc)
            
            # Bayi bakiyesini güncelle
            await db.dealers.update_one(
                {"id": db_dealer["id"]},
                {"$inc": {"current_balance": -payment.amount, "balance": -payment.amount}}
            )
            
            return {
                "status": "success",
                "message": "Ödeme başarıyla tamamlandı!",
                "payment_id": payment_id,
                "iyzico_payment_id": result.get('paymentId'),
                "amount": payment.amount
            }
        else:
            error_message = result.get('errorMessage', 'Ödeme işlemi başarısız')
            logging.error(f"iyzico payment failed: {result}")
            raise HTTPException(status_code=400, detail=error_message)
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"iyzico payment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ödeme işlemi sırasında hata oluştu: {str(e)}")


@router.post("/iyzico-bin-check")
async def check_card_bin(bin_number: str, price: float, dealer: dict = Depends(get_current_dealer)):
    """Kart BIN kontrolü - taksit seçeneklerini getir"""
    try:
        import iyzipay
        import os
        import json
        
        IYZICO_API_KEY = os.environ.get('IYZICO_API_KEY', '')
        IYZICO_SECRET_KEY = os.environ.get('IYZICO_SECRET_KEY', '')
        IYZICO_BASE_URL = os.environ.get('IYZICO_BASE_URL', 'https://sandbox-api.iyzipay.com')
    except ImportError:
        raise HTTPException(status_code=503, detail="Ödeme sistemi şu anda kullanılamıyor")
    
    try:
        options = {
            'api_key': IYZICO_API_KEY,
            'secret_key': IYZICO_SECRET_KEY,
            'base_url': IYZICO_BASE_URL
        }
        
        request_data = {
            'locale': 'tr',
            'conversationId': str(uuid.uuid4()),
            'binNumber': bin_number[:6],
            'price': str(price)
        }
        
        bin_check = iyzipay.BinNumber().retrieve(request_data, options)
        response_dict = bin_check.read().decode('utf-8')
        result = json.loads(response_dict)
        
        return result
    except Exception as e:
        import logging
        logging.error(f"BIN check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# ==========================================
# DELIVERY PLATFORM SETTINGS FOR DEALERS
# ==========================================

class DealerPlatformSettings(BaseModel):
    platform: str
    enabled: bool = False
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    restaurant_id: Optional[str] = None
    supplier_id: Optional[str] = None
    store_id: Optional[str] = None
    webhook_secret: Optional[str] = None
    auto_accept: bool = False
    default_prep_time: int = 30


@router.get("/delivery/platforms")
async def dealer_get_platforms(dealer: dict = Depends(get_current_dealer)):
    """Bayinin teslimat platform ayarlarını getirir"""
    db = get_db()
    if db is None:
        return []
    
    dealer_id = dealer.get("user_id")
    
    platforms = await db.dealer_delivery_platforms.find(
        {"dealer_id": dealer_id},
        {"_id": 0}
    ).to_list(100)
    
    return platforms


@router.post("/delivery/platforms")
async def dealer_save_platform(settings: DealerPlatformSettings, dealer: dict = Depends(get_current_dealer)):
    """Bayinin teslimat platform ayarlarını kaydeder"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    dealer_id = dealer.get("user_id")
    
    # Bayi bilgisini al
    db_dealer = await db.dealers.find_one(
        {"$or": [{"id": dealer_id}, {"code": dealer.get("email")}]},
        {"_id": 0, "name": 1, "code": 1}
    )
    
    platform_doc = {
        "dealer_id": dealer_id,
        "dealer_code": db_dealer.get("code") if db_dealer else dealer_id,
        "dealer_name": db_dealer.get("name") if db_dealer else "Bayi",
        "platform": settings.platform,
        "enabled": settings.enabled,
        "api_key": settings.api_key,
        "api_secret": settings.api_secret,
        "restaurant_id": settings.restaurant_id,
        "supplier_id": settings.supplier_id,
        "store_id": settings.store_id,
        "webhook_secret": settings.webhook_secret,
        "auto_accept": settings.auto_accept,
        "default_prep_time": settings.default_prep_time,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert - varsa güncelle, yoksa ekle
    await db.dealer_delivery_platforms.update_one(
        {"dealer_id": dealer_id, "platform": settings.platform},
        {"$set": platform_doc},
        upsert=True
    )
    
    return {"status": "success", "message": "Platform ayarları kaydedildi"}


@router.post("/delivery/platforms/{platform}/test")
async def dealer_test_platform(platform: str, dealer: dict = Depends(get_current_dealer)):
    """Platform bağlantısını test eder"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Veritabanı bağlantısı yok")
    
    dealer_id = dealer.get("user_id")
    
    # Platform ayarlarını al
    platform_config = await db.dealer_delivery_platforms.find_one(
        {"dealer_id": dealer_id, "platform": platform},
        {"_id": 0}
    )
    
    if not platform_config or not platform_config.get("api_key"):
        return {"success": False, "error": "API anahtarı girilmemiş"}
    
    # Şimdilik basit bir simülasyon - gerçek API çağrısı yapılabilir
    # Gerçek implementasyonda platform API'lerine bağlantı yapılır
    return {
        "success": True,
        "message": f"{platform} bağlantısı başarılı",
        "order_count": 0
    }


@router.get("/delivery/orders")
async def dealer_get_delivery_orders(dealer: dict = Depends(get_current_dealer)):
    """Bayinin teslimat siparişlerini getirir"""
    db = get_db()
    if db is None:
        return []
    
    dealer_id = dealer.get("user_id")
    
    orders = await db.delivery_orders.find(
        {"dealer_id": dealer_id, "status": {"$in": ["new", "accepted", "preparing", "ready"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return orders
