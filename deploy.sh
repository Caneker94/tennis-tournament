#!/bin/bash

# GMB Endüstri Bursa Open - Quick Deployment Script
# Bu script sunucuda çalıştırılmalıdır

echo "🎾 GMB Endüstri Bursa Open Deployment Başlıyor..."

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Proje dizini
PROJECT_DIR="/var/www/bursaopen"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
WEB_DIR="/var/www/html/bursaopen"

echo -e "${YELLOW}1. Backend güncelleniyor...${NC}"
cd $BACKEND_DIR
npm install --production

echo -e "${YELLOW}2. Frontend build alınıyor...${NC}"
cd $FRONTEND_DIR
npm install
npm run build

echo -e "${YELLOW}3. Frontend dosyaları kopyalanıyor...${NC}"
sudo mkdir -p $WEB_DIR
sudo cp -r dist/* $WEB_DIR/
sudo chown -R www-data:www-data $WEB_DIR

echo -e "${YELLOW}4. Backend yeniden başlatılıyor...${NC}"
pm2 restart bursaopen-backend

echo -e "${YELLOW}5. Nginx yeniden yükleniyor...${NC}"
sudo nginx -t && sudo systemctl reload nginx

echo -e "${GREEN}✅ Deployment tamamlandı!${NC}"
echo -e "${GREEN}Site: https://www.bursaopen.com${NC}"

# PM2 durumu göster
pm2 status

# Nginx durumu göster
sudo systemctl status nginx --no-pager
