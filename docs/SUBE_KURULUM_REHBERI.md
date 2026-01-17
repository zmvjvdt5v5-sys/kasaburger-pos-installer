# KasaBurger Şube Kurulum Rehberi

## 📋 Genel Bakış

Bu rehber, KasaBurger ERP ve Kiosk sisteminin şubelere nasıl kurulacağını açıklar.

---

## 🏗️ Kurulum Seçenekleri

### Seçenek 1: VPS/Sunucu Kurulumu (Önerilen)

Her şube için ayrı bir VPS (Virtual Private Server) kiralayarak kurulum yapılır.

**Önerilen VPS Sağlayıcıları:**
- Türkiye: Turhost, Natro, İHS Telekom
- Global: DigitalOcean, Hetzner, Contabo

**Minimum Sunucu Gereksinimleri:**
- CPU: 2 vCPU
- RAM: 4 GB
- Disk: 40 GB SSD
- OS: Ubuntu 22.04 LTS

**Aylık Maliyet:** ~150-300 TL / şube

---

### Seçenek 2: Docker ile Kurulum

Hazır Docker image'ı ile hızlı kurulum.

```bash
# Docker kurulumu
curl -fsSL https://get.docker.com | sh

# KasaBurger kurulumu
docker-compose up -d
```

---

## 🚀 Adım Adım Kurulum (VPS)

### 1. Sunucu Hazırlığı

```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Gerekli paketleri kur
sudo apt install -y git curl nginx certbot python3-certbot-nginx

# Node.js 20 kur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3.11 kur
sudo apt install -y python3.11 python3.11-venv python3-pip

# MongoDB kur
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod
```

### 2. Uygulama Kurulumu

```bash
# Proje klasörü oluştur
sudo mkdir -p /var/www/kasaburger
cd /var/www/kasaburger

# Kaynak kodları indir (GitHub'dan)
git clone https://github.com/KULLANICI_ADI/kasaburger-erp.git .

# Backend kurulumu
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend kurulumu
cd ../frontend
npm install
npm run build
```

### 3. Ortam Değişkenleri (.env)

**Backend (.env):**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=kasaburger_SUBE_ADI
JWT_SECRET=guclu_rastgele_sifre_buraya
CLOUDINARY_CLOUD_NAME=dgxiovaqv
CLOUDINARY_API_KEY=687782237383842
CLOUDINARY_API_SECRET=GIZLI_ANAHTAR
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=https://sube1.kasaburger.net.tr
```

### 4. Nginx Yapılandırması

```nginx
# /etc/nginx/sites-available/kasaburger
server {
    listen 80;
    server_name sube1.kasaburger.net.tr;

    # Frontend
    location / {
        root /var/www/kasaburger/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Nginx etkinleştir
sudo ln -s /etc/nginx/sites-available/kasaburger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL sertifikası al
sudo certbot --nginx -d sube1.kasaburger.net.tr
```

### 5. Servis Olarak Çalıştırma

**Backend Servis (/etc/systemd/system/kasaburger-backend.service):**
```ini
[Unit]
Description=KasaBurger Backend
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/kasaburger/backend
Environment=PATH=/var/www/kasaburger/backend/venv/bin
ExecStart=/var/www/kasaburger/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable kasaburger-backend
sudo systemctl start kasaburger-backend
```

---

## 📱 Kiosk Cihaz Kurulumu

### Android Tablet

1. **Chrome tarayıcıyı aç**
2. `https://sube1.kasaburger.net.tr/kiosk` adresine git
3. **Menü → Ana ekrana ekle** seç
4. **Kiosk modu** için: Ayarlar → Ekran sabitleme → Etkinleştir

**Önerilen Tabletler:**
- Samsung Galaxy Tab A8 / A9
- Lenovo Tab M10
- Xiaomi Pad 6

### iPad

1. **Safari'yi aç**
2. `https://sube1.kasaburger.net.tr/kiosk` adresine git
3. **Paylaş → Ana Ekrana Ekle**
4. **Kılavuzlu Erişim** için: Ayarlar → Erişilebilirlik → Kılavuzlu Erişim → Etkinleştir

### Dokunmatik PC / Normal Bilgisayar

1. **Chrome tarayıcıyı kur**
2. Kiosk URL'sini açtıktan sonra **F11** ile tam ekran yap
3. **Otomatik başlatma** için:

**Windows (Başlangıç scripti):**
```batch
@echo off
start chrome --kiosk https://sube1.kasaburger.net.tr/kiosk
```

**Linux (Autostart):**
```bash
# ~/.config/autostart/kiosk.desktop
[Desktop Entry]
Type=Application
Name=KasaBurger Kiosk
Exec=chromium-browser --kiosk https://sube1.kasaburger.net.tr/kiosk
```

---

## 🔧 Şube Yönetimi

### Yeni Şube Ekleme Checklist

- [ ] VPS/Sunucu kirala
- [ ] Domain DNS ayarla (sube2.kasaburger.net.tr → Sunucu IP)
- [ ] Kurulum scriptini çalıştır
- [ ] SSL sertifikası al
- [ ] Admin hesabı oluştur
- [ ] Ürünleri yükle (Kiosk Admin → Ürünleri Sıfırla)
- [ ] Kiosk cihazını yapılandır
- [ ] Test siparişi ver

### Merkezi İzleme (Opsiyonel)

Tüm şubeleri tek panelden izlemek için:
- **Uptime Kuma**: Sunucu durumu izleme
- **Grafana + Prometheus**: Performans metrikleri
- **Graylog**: Merkezi log toplama

---

## 📞 Destek

Kurulum sırasında sorun yaşarsanız:
- Email: teknik@kasaburger.com.tr
- WhatsApp Destek Hattı: +90 542 XXX XX XX

---

## 💰 Maliyet Özeti (20 Şube için)

| Kalem | Aylık Maliyet |
|-------|---------------|
| 20x VPS Sunucu | 3.000 - 6.000 TL |
| Domain (.com.tr) | ~200 TL/yıl |
| SSL Sertifikası | Ücretsiz (Let's Encrypt) |
| Cloudinary (Görsel) | Ücretsiz (25GB) |
| **Toplam** | **~3.500 TL/ay** |

---

## 🔄 Güncelleme Prosedürü

Her şubede güncelleme yapmak için:

```bash
cd /var/www/kasaburger
git pull origin main
cd frontend && npm install && npm run build
cd ../backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart kasaburger-backend
```

**Otomatik güncelleme scripti** için DevOps desteği alabilirsiniz.
