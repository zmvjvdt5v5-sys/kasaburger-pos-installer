# KBYS Desktop - Electron Masaüstü Uygulaması

Kasa Burger Yönetim Sistemi (KBYS) POS/Adisyon masaüstü uygulaması.

## Özellikler

- **Adisyon/POS Sistemi** - Masa yönetimi, sipariş alma, ödeme
- **Mutfak Ekranı** - Gerçek zamanlı sipariş takibi
- **InPOS Entegrasyonu** - Yazar kasa (ÖKC) desteği
- **Paket Servis** - Yemeksepeti, Getir, Trendyol, Migros entegrasyonu
- **Raporlama** - Günlük, haftalık, aylık satış raporları
- **Çevrimdışı Mod** - İnternet kesintilerinde çalışma (yakında)

## Kurulum (Geliştirici)

### Gereksinimler
- Node.js 18+
- Yarn

### Adımlar

```bash
# Bağımlılıkları yükle
cd frontend
yarn install

# Geliştirme modunda çalıştır
yarn electron-dev

# Production build oluştur
yarn electron-build
```

## Kurulum (Son Kullanıcı)

### Windows
1. `dist/KBYS Setup x.x.x.exe` dosyasını indirin
2. Çift tıklayarak çalıştırın
3. Kurulum sihirbazını takip edin

### Mac
1. `dist/KBYS-x.x.x.dmg` dosyasını indirin
2. DMG'yi açın ve KBYS'yi Applications'a sürükleyin

### Linux
1. `dist/KBYS-x.x.x.AppImage` dosyasını indirin
2. Çalıştırılabilir yap: `chmod +x KBYS-x.x.x.AppImage`
3. Çalıştır: `./KBYS-x.x.x.AppImage`

## Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| F1 | Adisyon (POS) |
| F2 | Mutfak Ekranı |
| F3 | Kasa Raporu |
| F4 | InPOS Ayarları |
| F5 | Canlı Siparişler |
| F6 | Paket Servis |
| F11 | Tam Ekran |
| F12 | Geliştirici Araçları |
| Ctrl+R | Yenile |
| Ctrl+Q | Çıkış |

## Yapılandırma

Uygulama ilk açılışta backend URL'ini soracaktır. Varsayılan:
- Yerel: `http://localhost:8001`
- Bulut: `https://erp.kasaburger.net.tr`

## Yazıcı Ayarları

InPOS/Yazar Kasa ile entegrasyon için:
1. F4 ile InPOS Ayarları'na gidin
2. Cihaz IP adresini girin (varsayılan: 192.168.1.100)
3. Port numarasını girin (varsayılan: 59000)
4. "Bağlantı Test" ile doğrulayın
5. Entegrasyonu aktifleştirin

## Sorun Giderme

### Uygulama açılmıyor
- Antivirüs yazılımını kontrol edin
- Yönetici olarak çalıştırmayı deneyin

### Backend'e bağlanamıyor
- İnternet bağlantısını kontrol edin
- Backend URL'inin doğru olduğundan emin olun
- Güvenlik duvarı ayarlarını kontrol edin

### InPOS bağlantı hatası
- Cihazın açık ve ağa bağlı olduğunu kontrol edin
- IP adresinin doğru olduğundan emin olun
- Aynı ağda olduğunuzdan emin olun

## Lisans

© 2026 Kasa Burger - Tüm hakları saklıdır.
