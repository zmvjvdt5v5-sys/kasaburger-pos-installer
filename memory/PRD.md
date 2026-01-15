# KasaBurger - Burger Köftesi İmalathanesi Yönetim Sistemi

## Problem Statement
Burger köftesi imalathanesi için üretim yönetimi, bayi satış, depo stok takibi, sipariş takibi, faturalama ve muhasebe içeren bir ERP benzeri yönetim sistemi.

## Architecture
- **Frontend:** React 19 + TailwindCSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** JWT (24 saat token)

## User Personas
1. **İmalathanesi Sahibi/Yönetici** - Tüm modüllere erişim, raporları görüntüleme
2. **Bayi** (Gelecekte) - Sipariş verme, kendi faturalarını görme

## Core Requirements
- [x] Kullanıcı kimlik doğrulama (JWT)
- [x] Ürün yönetimi (CRUD)
- [x] Hammadde ve stok yönetimi
- [x] Reçete yönetimi
- [x] Üretim emirleri
- [x] Bayi yönetimi (özel fiyatlandırma)
- [x] Sipariş yönetimi
- [x] Faturalama (KDV dahil)
- [x] Muhasebe (gelir-gider)
- [x] Raporlama dashboard
- [x] Türkçe arayüz
- [x] Responsive tasarım

## What's Been Implemented (January 2025)

### Backend API Endpoints
- `/api/auth/*` - Kayıt, giriş, kullanıcı bilgisi
- `/api/products/*` - Ürün CRUD
- `/api/materials/*` - Hammadde CRUD
- `/api/recipes/*` - Reçete yönetimi
- `/api/production/*` - Üretim emirleri
- `/api/dealers/*` - Bayi yönetimi
- `/api/orders/*` - Sipariş yönetimi
- `/api/invoices/*` - Fatura yönetimi
- `/api/transactions/*` - Muhasebe işlemleri
- `/api/stock-movements/*` - Stok hareketleri
- `/api/dashboard/stats` - Dashboard istatistikleri

### Frontend Pages
- Login/Register (JWT auth)
- Dashboard (istatistikler, grafikler)
- Ürünler (CRUD)
- Hammaddeler (CRUD, stok hareketleri)
- Reçeteler (malzeme listeli)
- Üretim (durum takibi)
- Bayiler (özel fiyatlandırma)
- Siparişler (durum takibi)
- Faturalar (KDV hesaplama, ödeme)
- Muhasebe (gelir-gider)
- Raporlar (grafikler)
- Ayarlar

### Design
- Dark theme (Industrial Smokehouse aesthetic)
- Ember Orange (#f97316) accent color
- Chivo (headings) + Inter (body) fonts
- Glassmorphism effects
- Bento grid dashboard layout

## Test Results
- Backend: 97% success rate
- Frontend: 95% success rate

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Authentication
- [x] Core CRUD operations
- [x] Dashboard

### P1 (High Priority)
- [ ] E-fatura entegrasyonu
- [ ] Bayi portal (ayrı login)
- [ ] PDF fatura çıktısı
- [ ] Excel raporları export

### P2 (Medium Priority)
- [ ] Mobil uygulama
- [ ] Push notifications
- [ ] Çoklu depo yönetimi
- [ ] Barkod/QR kod entegrasyonu

### P3 (Low Priority)
- [ ] AI destekli talep tahmini
- [ ] Tedarikçi yönetimi
- [ ] CRM modülü

## Next Tasks
1. PDF fatura export özelliği
2. Excel rapor indirme
3. Bayi self-service portal
4. E-fatura GIB entegrasyonu

---

## Update: January 2025 - Potansiyel İyileştirmeler Eklendi

### Yeni Özellikler
1. **PDF Fatura Export**
   - Her fatura için PDF indirme butonu
   - KasaBurger markalı profesyonel fatura formatı
   - Endpoint: `/api/invoices/{id}/pdf`

2. **Excel Rapor Export**
   - Tüm raporları tek Excel dosyasında indirme
   - Siparişler, Faturalar, Muhasebe, Stok sayfaları
   - Endpoint: `/api/reports/excel`

### Test Sonuçları
- Backend: %100 başarı
- Frontend: %95 başarı
- PDF ve Excel export tam çalışıyor

### Kalan İyileştirmeler (P1)
- [ ] E-fatura GIB entegrasyonu
- [ ] Bayi self-service portal
- [ ] Mobil uygulama

---

## Update: January 2025 - Bayi Portal & E-Fatura Eklendi

### Yeni Özellikler

1. **Bayi Self-Service Portal**
   - Ayrı login sayfası (/dealer-login)
   - Bayi kodu ile giriş (ilk girişte kod=şifre)
   - Ürün listesi ve bayi özel fiyatları
   - Sepet yönetimi (ekleme, miktar değiştirme, silme)
   - Online sipariş verme
   - Sipariş ve fatura geçmişi görüntüleme
   - Bakiye takibi

2. **E-Fatura XML Export**
   - UBL-TR 1.2 formatında XML export
   - GIB e-fatura standartlarına uygun
   - Satıcı/alıcı bilgileri
   - KDV hesaplamaları
   - Kalem detayları

### API Endpoints (Yeni)
- POST `/api/dealer-portal/login` - Bayi girişi
- GET `/api/dealer-portal/me` - Bayi bilgileri
- GET `/api/dealer-portal/products` - Ürünler (özel fiyatlarla)
- GET/POST `/api/dealer-portal/orders` - Siparişler
- GET `/api/dealer-portal/invoices` - Faturalar
- GET `/api/invoices/{id}/xml` - E-fatura XML export

### Test Sonuçları
- Backend: %100 başarı
- Frontend: %100 başarı
- Tüm yeni özellikler çalışıyor

### Sistem Özeti
- **Admin Panel:** Ürün, hammadde, reçete, üretim, bayi, sipariş, fatura, muhasebe, raporlar
- **Bayi Portal:** Ürün görme, sipariş verme, geçmiş siparişler/faturalar
- **Export:** PDF fatura, Excel rapor, E-fatura XML

---

## Update: January 15, 2026 - Deployment Health Check Düzeltmesi

### Çözülen Sorun
- **Problem:** Production deployment sırasında `/health` endpoint'i 404 döndürüyordu
- **Kök Neden:** Emergent platformunda `/api/*` prefix'i olmayan istekler frontend'e yönlendiriliyor, backend'e değil
- **Çözüm:** 
  1. Frontend'e `setupProxy.js` eklenerek `/health` istekleri backend'e proxy'lendi
  2. Backend'in root (`/`) endpoint'i de health check formatında döndürülecek şekilde güncellendi

### Teknik Değişiklikler
- `/app/frontend/src/setupProxy.js` - Yeni dosya, `/health` → backend proxy
- `/app/backend/server.py` - Root endpoint artık `{"status":"healthy",...}` döndürüyor

### Health Check Testleri (Hepsi ✅)
- `localhost:8001/health` → OK
- `localhost:8001/` → OK  
- `localhost:3000/health` → OK (proxy)
- External `/health` → OK
- External `/api/health` → OK

### Test Credentials
- **Admin:** admin@kasaburger.com / admin123
- **Bayi:** Bayi kodu = ilk şifre

### Sonraki Görevler (P1)
- [ ] E-fatura GİB gerçek entegrasyonu (şu an sadece XML export)
- [ ] Mobil uygulama

### Gelecek Görevler (P2)
- [ ] Push notifications
- [ ] Barkod/QR kod entegrasyonu
- [ ] Çoklu depo yönetimi

---

## Update: January 15, 2026 - Yeni Özellikler Eklendi

### ✅ Eklenen Özellikler

#### 1. 📦 Depo/Stok Yönetimi (Gelişmiş)
- Depo lokasyonları yönetimi (`/api/warehouses`)
- Düşük stok uyarıları Dashboard'da
- Stok sayım modülü (`/api/stock-counts`)

#### 2. 🧾 Bayi Şifre Yönetimi
- Bayilerin kendi şifrelerini değiştirmesi (Bayi Portal'da anahtar ikonu)
- Admin'in bayi şifresi sıfırlaması (`/api/dealers/{id}/reset-password`)

#### 3. 📊 Gelişmiş Raporlar
- Bayi bazlı satış raporu (`/api/reports/sales-by-dealer`)
- Ürün bazlı satış raporu (`/api/reports/sales-by-product`)
- Tarih aralıklı filtreleme

#### 4. 🔔 Bildirimler
- Düşük stok uyarısı
- Bekleyen sipariş bildirimi
- Vadesi geçmiş fatura uyarısı
- Dashboard'da bildirim kartı

#### 5. 📱 Bayi Portal Geliştirmeleri
- Şifre değiştirme (anahtar ikonu)
- Fatura PDF indirme
- Sipariş durumu takibi

#### 6. 🏭 Üretim Geliştirmeleri
- Otomatik stok düşümü (`/api/production/{id}/complete`)
- Üretim maliyeti hesaplama (`/api/production/{id}/cost`)

#### 7. 📥 Excel Import/Export
- Ürün Excel şablonu indirme (`/api/templates/products-excel`)
- Ürün Excel import (`/api/import/products-excel`)
- Hammadde Excel şablonu indirme (`/api/templates/materials-excel`)
- Hammadde Excel import (`/api/import/materials-excel`)

### Frontend Değişiklikleri
- `Products.js` - Excel'den Aktar butonu ve dialog eklendi
- `Materials.js` - Excel'den Aktar butonu ve dialog eklendi
- `Dashboard.js` - Bildirimler kartı eklendi
- `Reports.js` - Bayi/Ürün bazlı satış raporları ve tarih filtresi eklendi
- `DealerPortal.js` - Şifre değiştirme ve PDF indirme eklendi

### Test Edildi
- ✅ Dashboard bildirimleri
- ✅ Excel template indirme
- ✅ Gelişmiş raporlar
- ✅ Bayi portal PDF indirme
