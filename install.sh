#!/bin/bash

# KasaBurger Şube Kurulum Scripti
# Kullanım: sudo ./install.sh

set -e

echo "🍔 KasaBurger Şube Kurulum Başlıyor..."
echo "========================================"

# Renk tanımları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Şube bilgileri al
read -p "Şube ID (örn: sube-001): " BRANCH_ID
read -p "Şube Adı (örn: Ankara Kızılay): " BRANCH_NAME
read -p "Domain (örn: sube1.kasaburger.net.tr): " DOMAIN

# Güvenlik için rastgele JWT secret oluştur
JWT_SECRET=$(openssl rand -hex 32)

echo ""
echo -e "${YELLOW}Kurulum bilgileri:${NC}"
echo "  Şube ID: $BRANCH_ID"
echo "  Şube Adı: $BRANCH_NAME"
echo "  Domain: $DOMAIN"
echo ""

read -p "Devam etmek istiyor musunuz? (e/h): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ee]$ ]]; then
    echo "Kurulum iptal edildi."
    exit 1
fi

# 1. Sistem güncellemeleri
echo -e "\n${GREEN}[1/8]${NC} Sistem güncelleniyor..."
apt update && apt upgrade -y

# 2. Gerekli paketler
echo -e "\n${GREEN}[2/8]${NC} Gerekli paketler kuruluyor..."
apt install -y git curl nginx certbot python3-certbot-nginx docker.io docker-compose

# 3. Docker servisini başlat
echo -e "\n${GREEN}[3/8]${NC} Docker servisi başlatılıyor..."
systemctl enable docker
systemctl start docker

# 4. Proje dosyalarını indir
echo -e "\n${GREEN}[4/8]${NC} Proje dosyaları indiriliyor..."
mkdir -p /var/www/kasaburger
cd /var/www/kasaburger

# GitHub'dan indir (repo URL'sini değiştirin)
if [ -d ".git" ]; then
    git pull origin main
else
    git clone https://github.com/KULLANICI_ADI/kasaburger-erp.git .
fi

# 5. .env dosyasını oluştur
echo -e "\n${GREEN}[5/8]${NC} Yapılandırma dosyası oluşturuluyor..."
cat > .env << EOF
# KasaBurger Şube Yapılandırması
DB_NAME=kasaburger_${BRANCH_ID}
JWT_SECRET=${JWT_SECRET}
BRANCH_ID=${BRANCH_ID}
BRANCH_NAME=${BRANCH_NAME}
CLOUDINARY_CLOUD_NAME=dgxiovaqv
CLOUDINARY_API_KEY=687782237383842
CLOUDINARY_API_SECRET=UI5I8DJ8dcu-EI1tTswQhdh5Lg4
REACT_APP_BACKEND_URL=https://${DOMAIN}
PORT=8080
EOF

# 6. Docker ile başlat
echo -e "\n${GREEN}[6/8]${NC} Docker container'ları başlatılıyor..."
docker-compose up -d --build

# 7. Nginx yapılandırması
echo -e "\n${GREEN}[7/8]${NC} Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/kasaburger << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/kasaburger /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 8. SSL sertifikası
echo -e "\n${GREEN}[8/8]${NC} SSL sertifikası alınıyor..."
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m admin@kasaburger.net.tr

# Tamamlandı
echo ""
echo -e "${GREEN}========================================"
echo "✅ KURULUM TAMAMLANDI!"
echo "========================================${NC}"
echo ""
echo "Şube Bilgileri:"
echo "  - URL: https://${DOMAIN}"
echo "  - Kiosk: https://${DOMAIN}/kiosk"
echo "  - Admin: https://${DOMAIN}/login"
echo ""
echo "Varsayılan Giriş Bilgileri:"
echo "  - Email: admin@kasaburger.net.tr"
echo "  - Şifre: admin123"
echo ""
echo -e "${YELLOW}⚠️ ÖNEMLİ: İlk girişten sonra şifrenizi değiştirin!${NC}"
echo ""
echo "Yardım için: teknik@kasaburger.com.tr"
