# 🍔 KasaBurger POS - Masaüstü Uygulaması

Windows, Mac ve Linux için kurulabilir masaüstü uygulaması.

## 📦 Hazır Build İndirme (Önerilen)

> **Not:** Windows build'i oluşturmak için Wine gereklidir. Bayilerin kullanması için sunucu ortamında oluşturulamadı.

## 🛠️ Windows'ta Build Oluşturma

### Gereksinimler
- Node.js 18+ (https://nodejs.org)
- Git

### Adımlar

1. **Projeyi indirin:**
```bash
git clone <repo-url>
cd electron
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Windows installer oluşturun:**
```bash
npm run build:win
```

4. **Build çıktısı:**
```
dist/
├── KasaBurger POS Setup 1.0.0.exe  # Installer
├── KasaBurger POS 1.0.0.exe        # Portable
└── win-unpacked/                    # Unpacked files
```

## 🖥️ Linux'ta Build (ARM64)

Linux ARM64 build'i hazır:
```
dist/linux-arm64-unpacked/
└── kasaburger-pos              # Çalıştırılabilir dosya
```

## ⚙️ Yapılandırma

### Sunucu URL'si Değiştirme
Uygulama ayarlarından veya `main.js` dosyasından:
```javascript
serverUrl: 'https://your-domain.com'
```

### Özellikler
- ✅ Tek tıkla kurulum (NSIS Installer)
- ✅ Portable versiyon
- ✅ Otomatik güncelleme
- ✅ Sistem tepsisinde çalışma
- ✅ Klavye kısayolları (F1=POS, F2=Mutfak, F11=Tam Ekran)
- ✅ Native bildirimler

## 📱 Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| F1 | POS'a Git |
| F2 | Mutfak Ekranına Git |
| F5 | Sayfayı Yenile |
| F11 | Tam Ekran |
| Ctrl+P | Yazdır |
| Ctrl+Shift+I | Geliştirici Araçları |

## 🔧 Geliştirme

```bash
# Geliştirme modunda çalıştır
npm start

# Pack (unpacked build)
npm run pack

# Windows build
npm run build:win

# Mac build
npm run build:mac

# Linux build
npm run build:linux
```

## 📝 Notlar

- İlk çalıştırmada Windows Güvenlik Duvarı izin isteyebilir
- Antivirus yazılımları imzasız uygulamayı engelleyebilir (istisna ekleyin)
- Otomatik güncelleme için GitHub Releases kullanılır
