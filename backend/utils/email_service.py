"""Email Service - Resend ile email gönderimi"""
import os
import asyncio
import logging
import resend
from typing import Optional

logger = logging.getLogger(__name__)

# Resend API Key
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@kasaburger.net.tr")

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: Optional[str] = None
) -> dict:
    """Email gönder (async, non-blocking)"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY tanımlı değil, email gönderilmedi")
        return {"status": "skipped", "message": "API key not configured"}
    
    params = {
        "from": from_email or SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {email.get('id')}")
        return {
            "status": "success",
            "message": f"Email sent to {to_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Email gönderme hatası: {str(e)}")
        return {"status": "error", "message": str(e)}


async def send_dealer_order_notification(
    order_number: str,
    dealer_name: str,
    total: float,
    items: list,
    delivery_date: str,
    notes: str = ""
) -> dict:
    """Yeni bayi siparişi için admin'e email bildirimi"""
    
    # Ürün listesi HTML
    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.get('product_name', 'Ürün')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₺{item.get('total', 0):,.2f}</td>
        </tr>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🍔 Kasa Burger</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Yeni Bayi Siparişi</p>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e5e5; border-top: none; padding: 20px; border-radius: 0 0 10px 10px;">
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
                <strong style="color: #92400e;">⚠️ Onay Bekliyor</strong>
                <p style="margin: 5px 0 0 0; color: #78350f;">Bu sipariş admin onayınızı bekliyor.</p>
            </div>
            
            <table style="width: 100%; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 5px 0;"><strong>Sipariş No:</strong></td>
                    <td style="padding: 5px 0;">{order_number}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Bayi:</strong></td>
                    <td style="padding: 5px 0;">{dealer_name}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Teslimat Tarihi:</strong></td>
                    <td style="padding: 5px 0;">{delivery_date}</td>
                </tr>
            </table>
            
            <h3 style="border-bottom: 2px solid #f97316; padding-bottom: 10px; color: #333;">Sipariş Detayları</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="padding: 10px; text-align: left;">Ürün</th>
                        <th style="padding: 10px; text-align: center;">Adet</th>
                        <th style="padding: 10px; text-align: right;">Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
                <tfoot>
                    <tr style="background: #f97316; color: white;">
                        <td colspan="2" style="padding: 12px; font-weight: bold;">TOPLAM</td>
                        <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px;">₺{total:,.2f}</td>
                    </tr>
                </tfoot>
            </table>
            
            {"<div style='margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;'><strong>Not:</strong> " + notes + "</div>" if notes else ""}
            
            <div style="margin-top: 25px; text-align: center;">
                <a href="https://erp.kasaburger.net.tr/orders" 
                   style="display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Siparişi Görüntüle
                </a>
            </div>
        </div>
        
        <div style="text-align: center; padding: 15px; color: #888; font-size: 12px;">
            <p>Bu email otomatik olarak gönderilmiştir.</p>
            <p>Kasa Burger Yönetim Sistemi (KBYS)</p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🍔 Yeni Bayi Siparişi: {order_number} - {dealer_name}",
        html_content=html_content
    )
