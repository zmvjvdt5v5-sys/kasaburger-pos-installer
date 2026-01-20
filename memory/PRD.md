# Kasa Burger Yönetim Sistemi (KBYS) - PRD

## Proje Özeti
Kasa Burger franchise ağı için kapsamlı ERP ve POS sistemi.

## Temel Özellikler

### ✅ Tamamlanan Özellikler

#### 1. Self-Service Kiosk
- Müşteri sipariş ekranı
- Ürün kategorileri ve seçimi
- Sipariş özeti ve ödeme

#### 2. Multi-Branch Management (Çoklu Şube Yönetimi)
- Admin paneli
- Bayi yönetimi
- Ürün ve fiyatlandırma

#### 3. Sipariş Takip Sistemi (Yeni - 20 Ocak 2026)
- `/siparis-takip/:orderNumber` - Müşteri sipariş takip sayfası
- Salon TV ekranı (Hazırlanıyor + Hazır siparişler)
- Mutfak "Teslim Edildi" butonu
- KIOSK-XXXX ve K-XXXXXX format desteği

#### 4. Bayi Sipariş Onay Sistemi (Yeni - 20 Ocak 2026)
- TÜM bayi siparişleri otomatik "Onay Bekliyor" durumuna düşüyor
- Admin onayı sonrası otomatik fatura oluşturma
- Bayi bakiye güncelleme

#### 5. E-Fatura/GİB Entegrasyonu
- E-Fatura ve E-Arşiv belge oluşturma
- GİB API entegrasyonu (API bilgisi bekliyor)

#### 6. Mutfak Ekranı (Birleşik)
- Tüm siparişler tek ekranda
- Durum güncelleme (Hazırla, Hazır, Teslim Edildi)
- Sesli bildirimler

### 🔧 Son Düzeltmeler (20 Ocak 2026)

1. **Mobil Sipariş Takip Beyaz Ekran** - ÇÖZÜLDÜ
   - OrderTrack.js tamamen yeniden yazıldı
   - Eski tarayıcı uyumluluğu sağlandı
   - KIOSK-XXXX → K-XXXXXX format dönüşümü

2. **Salon Ekranında Siparişler Görünmüyor** - ÇÖZÜLDÜ
   - "Bekliyor" siparişler artık "Hazırlanıyor" sütununda
   - Display kodları tutarlı (KIOSK-XXXX formatı)

3. **E-Fatura/GİB Sayfası Siyah Ekran** - ÇÖZÜLDÜ
   - Select bileşenlerindeki boş string hatası düzeltildi

4. **Bayi Siparişleri Onaya Düşmüyor** - ÇÖZÜLDÜ
   - Tüm bayi siparişleri "pending_approval" durumunda başlıyor
   - Admin onayı sonrası fatura otomatik oluşuyor

### 📋 Bekleyen/Gelecek Görevler

#### P1 - Yüksek Öncelik
- [ ] E-fatura GIB API credentials bekleniyor
- [ ] InPOS yazıcı testi (fiziksel cihaz gerekli)
- [ ] Frontend oturum kaybı sorunu araştırması

#### P2 - Orta Öncelik  
- [ ] Delivery platform entegrasyonları (API anahtarları gerekli)
- [ ] Ödeme gateway entegrasyonu (Stripe/Iyzico)

#### P3 - Düşük Öncelik
- [ ] Teslim edilen siparişler dashboard
- [ ] KioskAdmin_old.js dosyası silinecek (kullanıcı onayı ile)

## Teknik Mimari

```
/app/
├── backend/
│   ├── routers/
│   │   ├── kitchen.py        # Mutfak, salon ekranı, sipariş takip
│   │   ├── dealer_portal.py  # Bayi portal (onay sistemi güncel)
│   │   ├── orders.py         # Sipariş yönetimi (fatura oluşturma)
│   │   └── ...
│   └── server.py
└── frontend/
    └── src/
        ├── pages/
        │   ├── OrderTrack.js     # Müşteri sipariş takip (yeniden yazıldı)
        │   ├── EInvoice.js       # E-Fatura (düzeltildi)
        │   ├── Dealers.js        # Bayi yönetimi
        │   └── kitchen/
        │       ├── UnifiedKitchen.js
        │       └── SalonDisplay.js
        └── components/
```

## Credentials
- Admin: admin@kasaburger.net.tr / admin123
- Bayi: MEKGRUP / 1234

## Son Güncelleme
20 Ocak 2026 - 4 kritik bug düzeltildi
