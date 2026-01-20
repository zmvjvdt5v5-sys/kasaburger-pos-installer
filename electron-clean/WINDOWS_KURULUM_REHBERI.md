# 🍔 KasaBurger POS - Masaüstü Uygulaması Kurulum Rehberi

## 📋 Adım Adım Kurulum (Windows)

### Adım 1: Node.js Kurulumu (Sadece bir kez yapılır)

1. Tarayıcınızı açın ve şu adrese gidin:
   **https://nodejs.org**

2. Yeşil "LTS" butonuna tıklayın ve indirin

3. İndirilen dosyayı çalıştırın (`node-v20.x.x-x64.msi`)

4. Kurulum sihirbazında "Next" > "Next" > "Install" tıklayın

5. Kurulum bitince bilgisayarı yeniden başlatın

---

### Adım 2: Electron Dosyalarını İndirin

**Seçenek A - GitHub'dan (Önerilen):**
1. Bu projenin GitHub sayfasına gidin
2. "Code" > "Download ZIP" tıklayın
3. ZIP'i açın ve `electron` klasörünü masaüstüne kopyalayın

**Seçenek B - Emergent'tan:**
1. Emergent platformunda "Save to Github" yapın
2. GitHub'dan klonlayın: `git clone <repo-url>`
3. `electron` klasörüne gidin

---

### Adım 3: Kurulum Paketini Oluşturun

1. `electron` klasörüne gidin

2. **KURULUM_OLUSTUR.bat** dosyasına çift tıklayın

3. İşlem 5-10 dakika sürebilir, bekleyin

4. İşlem bitince `dist` klasörü otomatik açılır

---

### Adım 4: Bayilere Dağıtım

`dist` klasöründe 2 dosya bulacaksınız:

| Dosya | Ne İşe Yarar | Boyut |
|-------|--------------|-------|
| `KasaBurger POS Setup 1.0.0.exe` | Installer (kurulum yapar) | ~80 MB |
| `KasaBurger POS 1.0.0.exe` | Portable (kurulum gerektirmez) | ~80 MB |

**Bayilere şunları gönderin:**
- `KasaBurger POS Setup 1.0.0.exe` dosyasını
- Aşağıdaki "Bayi Kurulum Talimatları" bölümünü

---

## 🏪 Bayi Kurulum Talimatları

### Bayilerin Yapması Gerekenler:

1. **Installer'ı çalıştırın** (`KasaBurger POS Setup 1.0.0.exe`)

2. Windows "Bilinmeyen yayımcı" uyarısı çıkarsa:
   - "Daha fazla bilgi" tıklayın
   - "Yine de çalıştır" tıklayın

3. Kurulum sihirbazını takip edin:
   - Kurulum klasörünü seçin (varsayılan: `C:\Program Files\KasaBurger POS`)
   - "Masaüstü kısayolu oluştur" işaretli olsun
   - "Yükle" tıklayın

4. Kurulum bitince uygulama otomatik açılır

5. **İlk açılışta:**
   - Giriş sayfası gelir
   - Bayi kodu ve şifrenizle giriş yapın

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---------|-------|
| **F1** | POS/Adisyon Ekranı |
| **F2** | Mutfak Ekranı |
| **F5** | Sayfayı Yenile |
| **F11** | Tam Ekran |
| **Ctrl+P** | Yazdır |
| **Ctrl+Q** | Çıkış |

---

## ❓ Sık Sorulan Sorular

### "Windows koruması" uyarısı çıkıyor?
Bu normal, uygulama henüz imzalanmamış. "Yine de çalıştır" tıklayın.

### Antivirus engelliyor?
Antivirus ayarlarından `KasaBurger POS` klasörünü istisna olarak ekleyin.

### Uygulama açılmıyor?
1. Bilgisayarı yeniden başlatın
2. Uygulamayı "Yönetici olarak çalıştır" deneyin

### İnternet olmadan çalışır mı?
Hayır, uygulama sunucuya bağlanması gerekir.

---

## 🔧 Teknik Bilgiler

- **Sunucu URL:** https://multi-branch-pos-7.preview.emergentagent.com
- **Min. Windows:** Windows 10 64-bit
- **Min. RAM:** 4 GB
- **Disk Alanı:** 200 MB

---

## 📞 Destek

Sorun yaşarsanız:
- E-posta: destek@kasaburger.net.tr
- Telefon: (Size ait destek hattı)
