# Kasa Burger Yönetim Sistemi (KBYS) - PRD

## Proje Özeti
Kasa Burger franchise ağı için kapsamlı ERP ve POS sistemi.

## ✅ Tamamlanan Özellikler (20 Ocak 2026)

### Sipariş Takip Sistemi
- `/siparis-takip/:orderNumber` - Müşteri sipariş takip sayfası
- KIOSK-XXXX format desteği (K-XXXXXX otomatik dönüşüm)
- Salon TV ekranı (Hazırlanıyor + Hazır siparişler)
- Mutfak "Teslim Edildi" butonu
- Production homepage hatası düzeltildi

### Bayi Sipariş Onay Sistemi
- TÜM bayi siparişleri otomatik "Onay Bekliyor" durumuna düşüyor
- Admin onayı sonrası otomatik fatura oluşturma
- Bayi bakiye güncelleme

### Email Bildirim Sistemi (Yeni)
- Resend entegrasyonu kuruldu
- Bayi siparişlerinde admin'e otomatik email bildirimi
- Domain: kasaburger.com.tr (doğrulama bekliyor)
- Admin email: bayi@kasaburger.com.tr

### E-Fatura/GİB
- Select bileşen hatası düzeltildi
- Sayfa düzgün çalışıyor

## 🔧 Son Düzeltmeler (20 Ocak 2026)

1. **Mobil Sipariş Takip Beyaz Ekran** - ÇÖZÜLDÜ
2. **Sipariş Numarası Formatı** - KIOSK-XXXX formatı uygulandı
3. **"Siparişi Takip Et" URL** - KIOSK formatında yönlendirme
4. **Production Beyaz Ekran** - homepage: "/" düzeltmesi
5. **Bayi Siparişleri Onaya Düşmüyor** - ÇÖZÜLDÜ
6. **E-Fatura Sayfası Siyah Ekran** - ÇÖZÜLDÜ

## 📋 Bekleyen Görevler

### Email Sistemi
- [ ] kasaburger.com.tr domain doğrulaması (Resend)
- [ ] Email testi

### P1 - Yüksek Öncelik
- [ ] E-fatura GIB API credentials
- [ ] InPOS yazıcı testi (fiziksel cihaz)
- [ ] Frontend oturum kaybı sorunu

### P2 - Orta Öncelik
- [ ] Delivery platform entegrasyonları
- [ ] Ödeme gateway entegrasyonu

## Teknik Notlar

### Email Ayarları (.env)
```
RESEND_API_KEY=re_JfJuYJCw_Hcf2rs8eXs4TttTsdnrnLsPj
SENDER_EMAIL=siparis@kasaburger.com.tr
ADMIN_EMAIL=bayi@kasaburger.com.tr
```

### Credentials
- Admin: admin@kasaburger.net.tr / admin123
- Bayi: MEKGRUP / 1234

## Son Güncelleme
20 Ocak 2026
