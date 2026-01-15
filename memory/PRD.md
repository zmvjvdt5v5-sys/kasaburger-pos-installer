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
