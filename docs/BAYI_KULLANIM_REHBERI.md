# 🍔 KasaBurger Bayi Portalı Kullanım Rehberi

## Bayiler İçin Uzaktan Erişim ve Kullanım Kılavuzu

---

## 📱 1. SİSTEME GİRİŞ

### Adım 1: Tarayıcıyı Açın
- Chrome, Firefox, Safari veya Edge tarayıcısını açın
- Adres çubuğuna şu adresi yazın:

```
https://franchise-pos.preview.emergentagent.com/dealer-login
```

### Adım 2: Giriş Bilgilerini Girin
- **Bayi Kodu:** Merkez tarafından size verilen kod (örn: MEKGRUP, BY-001)
- **Şifre:** Size verilen şifre

![Giriş Ekranı]
- Bayi Kodu kutusuna kodunuzu yazın
- Şifre kutusuna şifrenizi yazın
- "Giriş Yap" butonuna tıklayın

---

## 🛒 2. SİPARİŞ VERME

### Ana Ekran
Giriş yaptıktan sonra **Bayi Portalı** ana ekranını göreceksiniz.

### Sipariş Oluşturma Adımları:

#### Adım 1: "Sipariş Ver" Sekmesine Gidin
- Üstteki menüden "Sipariş" sekmesine tıklayın

#### Adım 2: Kategori Seçin
- Sol tarafta ürün kategorileri görünür:
  - Burger Köfteleri
  - Soslar
  - Ekmekler
  - İçecekler
  - vb.

#### Adım 3: Ürün Ekleyin
- İstediğiniz ürüne tıklayın
- Miktar belirleyin (+/- butonları ile)
- "Sepete Ekle" butonuna tıklayın

#### Adım 4: Sepeti Kontrol Edin
- Sağ tarafta sepetinizi görün
- Toplam tutar otomatik hesaplanır

#### Adım 5: Siparişi Tamamlayın
- "Sipariş Ver" butonuna tıklayın
- Onay mesajını bekleyin

---

## 💳 3. ÖDEME YAPMA

### Adım 1: "Ödeme Yap" Sekmesine Gidin

### Adım 2: Ödeme Yöntemi Seçin
- **Havale/EFT:** Banka hesap bilgileri görünecek
- **Kredi Kartı:** Kart bilgilerini girin

### Adım 3: Tutarı Girin
- Ödemek istediğiniz tutarı yazın
- Açıklama ekleyin (isteğe bağlı)

### Adım 4: Ödemeyi Onaylayın
- "Ödeme Yap" butonuna tıklayın

---

## 📊 4. EKSTRE ve BORÇ DURUMU

### Ekstre Görüntüleme
- "Ekstre" sekmesine tıklayın
- Tarih aralığı seçin
- Tüm hareketlerinizi görün:
  - Siparişler
  - Ödemeler
  - Bakiye

### Borç Durumu
- Ana ekranda "Güncel Bakiye" kartını görün
- Kırmızı = Borç
- Yeşil = Alacak

---

## 🚀 5. YEMEK PLATFORMLARI ENTEGRASYONU

### Platformlarınızı Bağlayın
Yemeksepeti, Getir, Trendyol, Migros siparişlerinizi otomatik almak için:

### Adım 1: "Platformlar" Sekmesine Gidin

### Adım 2: Platform Seçin
- Yemeksepeti 🍽️
- Getir Yemek 🛵
- Trendyol Yemek 🛒
- Migros Yemek 🏪

### Adım 3: API Bilgilerini Girin

#### Yemeksepeti için:
1. https://restoran.yemeksepeti.com adresine gidin
2. Ayarlar → API Entegrasyonu bölümüne gidin
3. API Key ve API Secret'ı kopyalayın
4. KasaBurger'a yapıştırın

#### Getir için:
1. https://partner.getir.com adresine gidin
2. Entegrasyonlar → API Anahtarları bölümüne gidin
3. Bilgileri kopyalayıp yapıştırın

### Adım 4: Webhook URL'yi Ekleyin
- Sistem size otomatik bir URL verecek
- Bu URL'yi platform panelinizdeki "Webhook" bölümüne yapıştırın

### Adım 5: Bağlantıyı Test Edin
- "Bağlantıyı Test Et" butonuna tıklayın
- Yeşil ✓ görürseniz başarılı!

---

## 🖥️ 6. POS/ADİSYON SİSTEMİ (Şube İçi Kullanım)

### POS'a Erişim
- Ana menüden "Adisyon" linkine tıklayın
- veya direkt: `/pos` adresine gidin

### Masa Yönetimi
- Masaları görsel olarak görün
- Dolu/Boş durumlarını takip edin
- Masaya tıklayarak sipariş açın

### Sipariş Alma
1. Masa seçin
2. Ürünleri ekleyin
3. "Mutfağa Gönder" butonuna tıklayın

### Ödeme Alma
1. "Ödeme Al" butonuna tıklayın
2. Ödeme yöntemi seçin:
   - Nakit
   - Kredi Kartı
   - Yemeksepeti Online
   - Getir Online
   - vb.
3. Tutarı onaylayın

### Teslimat Siparişleri
- Sağ panelde gelen siparişleri görün
- "Kabul" ile siparişi alın
- "Hazır" ile teslimata hazır işaretleyin

---

## ⚙️ 7. AYARLAR

### Yazıcı Ayarları (InPOS/ÖKC)
- POS ekranında ⚙️ simgesine tıklayın
- Yazıcı IP ve Port'u girin
- Test fişi yazdırın

### Bildirim Ayarları
- Ses açık/kapalı
- Push bildirimleri

---

## ❓ 8. SIK SORULAN SORULAR

### S: Şifremi unuttum, ne yapmalıyım?
**C:** Merkez ile iletişime geçin, yeni şifre oluşturulacaktır.

### S: Sipariş verdim ama görünmüyor?
**C:** Sayfayı yenileyin (F5). Hala görünmüyorsa merkezi arayın.

### S: Platform siparişleri gelmiyor?
**C:** 
1. Platform ayarlarını kontrol edin
2. API key'lerin doğru olduğundan emin olun
3. Webhook URL'nin eklendiğinden emin olun

### S: Yazıcıdan fiş çıkmıyor?
**C:**
1. Yazıcı açık mı kontrol edin
2. IP adresinin doğru olduğundan emin olun
3. Test fişi deneyin

---

## 📞 9. DESTEK

### Teknik Destek
- **Telefon:** [Merkez telefon numarası]
- **E-posta:** [Destek e-postası]
- **WhatsApp:** [WhatsApp numarası]

### Çalışma Saatleri
- Pazartesi - Cumartesi: 09:00 - 22:00
- Pazar: 10:00 - 20:00

---

## 🔐 10. GÜVENLİK ÖNERİLERİ

1. **Şifrenizi kimseyle paylaşmayın**
2. **Ortak bilgisayarlarda "Beni Hatırla" seçmeyin**
3. **İşiniz bitince "Çıkış Yap" butonuna tıklayın**
4. **Şüpheli bir durum görürseniz merkezi bilgilendirin**

---

## 📋 HIZLI ERİŞİM LİNKLERİ

| Sayfa | Link |
|-------|------|
| Bayi Girişi | `/dealer-login` |
| Bayi Portalı | `/dealer-portal` |
| Platform Ayarları | `/dealer-portal/delivery-settings` |
| POS Sistemi | `/pos` |

---

**Son Güncelleme:** Ocak 2026
**Versiyon:** 1.0

© KasaBurger Yönetim Sistemi
