"""
Bayi Kullanım Rehberi PDF Generator
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, ListFlowable, ListItem
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import re
import os

# Output path
OUTPUT_PATH = '/app/docs/BAYI_KULLANIM_REHBERI.pdf'

def create_styles():
    """Create custom styles for the PDF"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontSize=36,
        textColor=colors.HexColor('#f97316'),
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    ))
    
    # Subtitle
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontSize=24,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER,
        spaceAfter=10
    ))
    
    # H1
    styles.add(ParagraphStyle(
        name='Heading1Custom',
        fontSize=20,
        textColor=colors.HexColor('#f97316'),
        spaceAfter=15,
        spaceBefore=30,
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderColor=colors.HexColor('#f97316'),
        borderPadding=5
    ))
    
    # H2
    styles.add(ParagraphStyle(
        name='Heading2Custom',
        fontSize=16,
        textColor=colors.HexColor('#ea580c'),
        spaceAfter=12,
        spaceBefore=25,
        fontName='Helvetica-Bold',
        leftIndent=10,
        borderWidth=2,
        borderColor=colors.HexColor('#f97316'),
        borderPadding=3
    ))
    
    # H3
    styles.add(ParagraphStyle(
        name='Heading3Custom',
        fontSize=13,
        textColor=colors.HexColor('#c2410c'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    ))
    
    # H4
    styles.add(ParagraphStyle(
        name='Heading4Custom',
        fontSize=11,
        textColor=colors.HexColor('#7c2d12'),
        spaceAfter=8,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='BodyCustom',
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        spaceAfter=8,
        alignment=TA_JUSTIFY,
        leading=14
    ))
    
    # List item
    styles.add(ParagraphStyle(
        name='ListItem',
        fontSize=10,
        textColor=colors.HexColor('#333333'),
        spaceAfter=5,
        leftIndent=20,
        bulletIndent=10,
        leading=14
    ))
    
    # Code style
    styles.add(ParagraphStyle(
        name='CodeCustom',
        fontSize=9,
        fontName='Courier',
        textColor=colors.HexColor('#1f2937'),
        backColor=colors.HexColor('#f3f4f6'),
        spaceAfter=10,
        spaceBefore=5,
        leftIndent=10,
        rightIndent=10,
        borderPadding=8
    ))
    
    return styles

def create_cover_page(styles):
    """Create cover page elements"""
    elements = []
    elements.append(Spacer(1, 5*cm))
    elements.append(Paragraph("🍔 KasaBurger", styles['CoverTitle']))
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph("Bayi Portalı", styles['CoverSubtitle']))
    elements.append(Paragraph("Kullanım Rehberi", styles['CoverSubtitle']))
    elements.append(Spacer(1, 3*cm))
    elements.append(Paragraph("Versiyon 1.0", styles['BodyCustom']))
    elements.append(Paragraph("Ocak 2026", styles['BodyCustom']))
    elements.append(PageBreak())
    return elements

def create_content(styles):
    """Create document content"""
    elements = []
    
    # Bölüm 1: Sisteme Giriş
    elements.append(Paragraph("📱 1. SİSTEME GİRİŞ", styles['Heading1Custom']))
    
    elements.append(Paragraph("<b>Adım 1: Tarayıcıyı Açın</b>", styles['Heading3Custom']))
    elements.append(Paragraph("Chrome, Firefox, Safari veya Edge tarayıcısını açın ve adres çubuğuna aşağıdaki adresi yazın:", styles['BodyCustom']))
    elements.append(Paragraph("https://multi-branch-pos-7.preview.emergentagent.com/dealer-login", styles['CodeCustom']))
    
    elements.append(Paragraph("<b>Adım 2: Giriş Bilgilerini Girin</b>", styles['Heading3Custom']))
    elements.append(Paragraph("• <b>Bayi Kodu:</b> Merkez tarafından size verilen kod (örn: MEKGRUP, BY-001)", styles['ListItem']))
    elements.append(Paragraph("• <b>Şifre:</b> Size verilen şifre", styles['ListItem']))
    elements.append(Paragraph("Giriş bilgilerinizi girdikten sonra \"Giriş Yap\" butonuna tıklayın.", styles['BodyCustom']))
    
    # Bölüm 2: Sipariş Verme
    elements.append(Paragraph("🛒 2. SİPARİŞ VERME", styles['Heading1Custom']))
    
    elements.append(Paragraph("<b>Sipariş Oluşturma Adımları:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("• <b>Adım 1:</b> \"Sipariş Ver\" sekmesine gidin", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 2:</b> Sol taraftan kategori seçin (Burger Köfteleri, Soslar, Ekmekler, vb.)", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 3:</b> İstediğiniz ürüne tıklayın, miktar belirleyin ve \"Sepete Ekle\"ye basın", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 4:</b> Sağ tarafta sepetinizi kontrol edin", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 5:</b> \"Sipariş Ver\" butonuna tıklayın ve onay mesajını bekleyin", styles['ListItem']))
    
    # Bölüm 3: Ödeme
    elements.append(Paragraph("💳 3. ÖDEME YAPMA", styles['Heading1Custom']))
    
    elements.append(Paragraph("• <b>Adım 1:</b> \"Ödeme Yap\" sekmesine gidin", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 2:</b> Ödeme yöntemi seçin (Havale/EFT veya Kredi Kartı)", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 3:</b> Tutarı girin ve açıklama ekleyin (isteğe bağlı)", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 4:</b> \"Ödeme Yap\" butonuna tıklayın", styles['ListItem']))
    
    # Bölüm 4: Ekstre
    elements.append(Paragraph("📊 4. EKSTRE ve BORÇ DURUMU", styles['Heading1Custom']))
    
    elements.append(Paragraph("<b>Ekstre Görüntüleme:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("\"Ekstre\" sekmesine tıklayın, tarih aralığı seçin ve tüm hareketlerinizi görün: Siparişler, Ödemeler, Bakiye.", styles['BodyCustom']))
    
    elements.append(Paragraph("<b>Borç Durumu:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("Ana ekranda \"Güncel Bakiye\" kartını görün. <font color='red'>Kırmızı = Borç</font>, <font color='green'>Yeşil = Alacak</font>", styles['BodyCustom']))
    
    # Bölüm 5: Platform Entegrasyonu
    elements.append(Paragraph("🚀 5. YEMEK PLATFORMLARI ENTEGRASYONU", styles['Heading1Custom']))
    
    elements.append(Paragraph("<b>Platformlarınızı Bağlayın:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("Yemeksepeti, Getir, Trendyol, Migros siparişlerinizi otomatik almak için:", styles['BodyCustom']))
    elements.append(Paragraph("• <b>Adım 1:</b> \"Platformlar\" sekmesine gidin", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 2:</b> İlgili platform kartına tıklayın", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 3:</b> API Key ve Secret bilgilerinizi girin", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 4:</b> \"Bağlantıyı Test Et\" butonuna tıklayın", styles['ListItem']))
    elements.append(Paragraph("• <b>Adım 5:</b> Yeşil onay işareti görünürse bağlantı başarılı!", styles['ListItem']))
    
    # Bölüm 6: POS/Adisyon
    elements.append(Paragraph("🍽️ 6. POS / ADİSYON SİSTEMİ", styles['Heading1Custom']))
    
    elements.append(Paragraph("<b>Masadan Sipariş:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("• Masa planından boş bir masaya tıklayın", styles['ListItem']))
    elements.append(Paragraph("• Ürünleri ekleyin ve \"Mutfağa Gönder\"e basın", styles['ListItem']))
    elements.append(Paragraph("• Sipariş mutfak ekranında görünecektir", styles['ListItem']))
    
    elements.append(Paragraph("<b>Paket Sipariş:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("• \"Gel-Al\" veya \"Paket\" butonuna tıklayın", styles['ListItem']))
    elements.append(Paragraph("• Müşteri bilgilerini girin", styles['ListItem']))
    elements.append(Paragraph("• Siparişi tamamlayın - Otomatik sıra numarası (PKT-0001) atanır", styles['ListItem']))
    
    # Bölüm 7: Mutfak Ekranı
    elements.append(Paragraph("👨‍🍳 7. MUTFAK EKRANI", styles['Heading1Custom']))
    
    elements.append(Paragraph("Sol menüden \"Mutfak Ekranı\"na gidin. Tüm siparişler tek ekranda görünür:", styles['BodyCustom']))
    
    # Tablo: Sipariş Kodları
    table_data = [
        ['Kod Tipi', 'Açıklama', 'Örnek'],
        ['MASA-X', 'Salon Siparişleri', 'MASA-5'],
        ['PKT-XXXX', 'Paket/Kiosk Siparişleri', 'PKT-0001'],
        ['ONLNPKT-XXXX', 'Online Platform Siparişleri', 'ONLNPKT-0001']
    ]
    
    table = Table(table_data, colWidths=[4*cm, 6*cm, 4*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#fff7ed')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
        ('ROWHEIGHT', (0, 0), (-1, -1), 25),
    ]))
    elements.append(Spacer(1, 10))
    elements.append(table)
    elements.append(Spacer(1, 10))
    
    elements.append(Paragraph("<b>Sipariş Durumu Akışı:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("YENİ → HAZIRLANIYOR → HAZIR → TESLİM EDİLDİ", styles['CodeCustom']))
    elements.append(Paragraph("Her siparişin yanındaki butonlara tıklayarak durumu güncelleyin.", styles['BodyCustom']))
    
    # Bölüm 8: Salon Ekranı
    elements.append(Paragraph("📺 8. SALON BEKLEME EKRANI", styles['Heading1Custom']))
    
    elements.append(Paragraph("Müşterilerin görebileceği TV ekranı için: <b>/salon-ekran</b> adresine gidin.", styles['BodyCustom']))
    elements.append(Paragraph("Bu ekran kimlik doğrulaması gerektirmez ve hazır olan sipariş numaralarını gösterir.", styles['BodyCustom']))
    
    # Bölüm 9: Destek
    elements.append(Paragraph("📞 9. DESTEK", styles['Heading1Custom']))
    
    elements.append(Paragraph("<b>Teknik Destek:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("• Telefon: 0850 XXX XX XX", styles['ListItem']))
    elements.append(Paragraph("• E-posta: destek@kasaburger.com.tr", styles['ListItem']))
    elements.append(Paragraph("• WhatsApp: 05XX XXX XX XX", styles['ListItem']))
    
    elements.append(Paragraph("<b>Sık Karşılaşılan Sorunlar:</b>", styles['Heading3Custom']))
    elements.append(Paragraph("• <b>Giriş yapamıyorum:</b> Şifrenizi sıfırlamak için merkez ile iletişime geçin", styles['ListItem']))
    elements.append(Paragraph("• <b>Siparişler gelmiyor:</b> Platform API bağlantınızı kontrol edin", styles['ListItem']))
    elements.append(Paragraph("• <b>Yazıcı çalışmıyor:</b> Yazıcı IP adresini ayarlardan kontrol edin", styles['ListItem']))
    
    return elements

def generate_pdf():
    """Generate the PDF document"""
    # Create document
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Get styles
    styles = create_styles()
    
    # Build content
    elements = []
    elements.extend(create_cover_page(styles))
    elements.extend(create_content(styles))
    
    # Build PDF
    doc.build(elements)
    
    # Get file size
    file_size = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"✅ PDF oluşturuldu: {OUTPUT_PATH}")
    print(f"📄 Dosya boyutu: {file_size:.1f} KB")

if __name__ == "__main__":
    generate_pdf()
