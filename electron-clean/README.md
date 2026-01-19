# KasaBurger POS - Desktop Uygulaması

## Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Geliştirme Ortamı
```bash
cd electron
npm install
npm start
```

### Derleme (Build)

#### Windows
```bash
npm run build:win
```
Çıktı: `dist/KasaBurger POS Setup.exe` (kurulum dosyası)
       `dist/KasaBurger POS.exe` (portable)

#### macOS
```bash
npm run build:mac
```
Çıktı: `dist/KasaBurger POS.dmg`

#### Linux
```bash
npm run build:linux
```
Çıktı: `dist/KasaBurger POS.deb` (Debian/Ubuntu)
       `dist/KasaBurger POS.AppImage` (Universal)

## Özellikler

### Temel Özellikler
- ✅ Tek pencere uygulaması
- ✅ Sistem tepsisinde çalışma (minimize to tray)
- ✅ Otomatik güncelleme
- ✅ Klavye kısayolları
- ✅ Native bildirimler
- ✅ Tam ekran modu

### Klavye Kısayolları
| Kısayol | İşlem |
|---------|-------|
| F1 | POS Sistemi |
| F2 | Mutfak Ekranı |
| F3 | Raporlar |
| F11 | Tam Ekran |
| Ctrl+N | Yeni Sipariş |
| Ctrl+Z | Z Raporu |
| Ctrl+X | X Raporu |
| Ctrl+K | Kasa Aç |
| Ctrl+Q | Çıkış |

### Menü Yapısı
```
Dosya
├── Yeni Sipariş (Ctrl+N)
├── Ayarlar (Ctrl+,)
└── Çıkış (Ctrl+Q)

Görünüm
├── POS Sistemi (F1)
├── Mutfak Ekranı (F2)
├── Raporlar (F3)
├── Tam Ekran (F11)
├── Yenile
└── Zorla Yenile

İşlemler
├── Z Raporu Al (Ctrl+Z)
├── X Raporu Al (Ctrl+X)
├── Kasa Aç (Ctrl+K)
└── Test Fişi

Yardım
├── Hakkında
├── Güncellemeleri Kontrol Et
└── Geliştirici Araçları (Ctrl+Shift+I)
```

## Yapılandırma

Uygulama ayarları `electron-store` ile saklanır:
- `serverUrl`: Backend sunucu adresi
- `windowBounds`: Pencere boyutları
- `autoUpdate`: Otomatik güncelleme
- `startMinimized`: Başlangıçta gizli başlat
- `alwaysOnTop`: Her zaman üstte

## Dağıtım

### Windows Code Signing
Windows için imzalı uygulama oluşturmak için:
1. EV Code Signing sertifikası edinin
2. `electron-builder.yml` dosyasına sertifika bilgilerini ekleyin

### Auto Update Sunucusu
Otomatik güncelleme için:
1. GitHub Releases kullanın
2. veya kendi sunucunuzu kurun

## Sorun Giderme

### Uygulama açılmıyor
- Node.js versiyonunu kontrol edin
- `npm install` ile bağımlılıkları yeniden yükleyin

### Güncelleme çalışmıyor
- İnternet bağlantısını kontrol edin
- Güncelleme sunucusunun erişilebilir olduğundan emin olun
