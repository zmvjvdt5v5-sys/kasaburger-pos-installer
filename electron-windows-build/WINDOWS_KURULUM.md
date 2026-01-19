# 🍔 KasaBurger POS - Windows Kurulum Rehberi

## 📋 Gereksinimler

- Windows 10/11 (64-bit)
- Node.js 18 veya üzeri: https://nodejs.org/
- İnternet bağlantısı

---

## 🚀 Hızlı Kurulum (5 Dakika)

### Adım 1: Node.js Yükleyin
1. https://nodejs.org/ adresine gidin
2. "LTS" sürümünü indirin ve kurun
3. Kurulum sırasında tüm varsayılan ayarları kabul edin

### Adım 2: Bu Klasörü Açın
1. Bu klasörü bilgisayarınıza kopyalayın (örn: `C:\KasaBurger-Build`)
2. Klasör içinde boş bir yere **Shift + Sağ Tık** yapın
3. "PowerShell penceresini burada aç" seçin

### Adım 3: Bağımlılıkları Yükleyin
PowerShell'de şu komutu yazın:
```powershell
npm install
```
Bu işlem 2-3 dakika sürebilir.

### Adım 4: Windows Installer Oluşturun
```powershell
npm run build:win
```

### Adım 5: Kurulum Dosyasını Bulun
İşlem tamamlandığında `dist` klasöründe şu dosyaları bulacaksınız:
- `KasaBurger POS Setup 1.0.0.exe` - Kurulum dosyası (önerilen)
- `KasaBurger-POS-Portable-1.0.0.exe` - Taşınabilir sürüm

---

## 📦 Kurulum Dosyasını Dağıtma

1. `dist` klasöründeki `.exe` dosyasını USB'ye kopyalayın
2. Bayi bilgisayarlarına götürün
3. Çift tıklayarak kurun

---

## ⚙️ Ayarlar

### Sunucu Adresi Değiştirme
Eğer farklı bir sunucu kullanıyorsanız, `main.js` dosyasını açın ve şu satırı bulun:
```javascript
serverUrl: 'https://franchise-pos.preview.emergentagent.com'
```
Kendi adresinizle değiştirin.

---

## 🔧 Sorun Giderme

### "npm not found" hatası
- Node.js'i yeniden kurun
- Bilgisayarı yeniden başlatın

### Antivirus uyarısı
- İmzasız uygulama uyarısı alabilirsiniz
- "Yine de çalıştır" seçeneğini tıklayın
- Veya antivirüs yazılımınıza istisna ekleyin

### Build başarısız
- İnternet bağlantınızı kontrol edin
- `node_modules` klasörünü silip `npm install` tekrar çalıştırın

---

## 📞 Destek

Sorun yaşarsanız merkez ile iletişime geçin:
- Telefon: 0850 XXX XX XX
- E-posta: destek@kasaburger.com.tr
