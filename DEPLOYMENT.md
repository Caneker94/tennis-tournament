# GMB Endüstri Bursa Open - Deployment Rehberi

## 🌐 Domain: www.bursaopen.com

Bu rehber, uygulamanın Hostinger'a nasıl deploy edileceğini adım adım açıklar.

## Gereksinimler

### Hostinger Hosting Türü
- ✅ **VPS** veya **Cloud Hosting** (Önerilen)
- ❌ **Shared Hosting** (Node.js desteği yok)

### Sunucu Gereksinimleri
- Node.js 18+
- npm 9+
- PM2 (process manager)
- Nginx (reverse proxy)
- SSL sertifikası (Let's Encrypt)

## 1. Sunucu Hazırlığı

### SSH ile Sunucuya Bağlanma
```bash
ssh root@your-server-ip
```

### Node.js Kurulumu
```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js kur
sudo apt-get install -y nodejs

# Versiyonları kontrol et
node --version
npm --version
```

### PM2 Kurulumu (Process Manager)
```bash
sudo npm install -g pm2
```

### Nginx Kurulumu
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 2. Uygulama Dosyalarını Yükleme

### Dosyaları Sunucuya Transfer Etme

#### Yöntem 1: Git (Önerilen)
```bash
# Sunucuda
cd /var/www
git clone https://your-repo-url.git bursaopen
cd bursaopen
```

#### Yöntem 2: FTP/SFTP
- FileZilla veya WinSCP kullanarak dosyaları `/var/www/bursaopen` klasörüne yükleyin

### Dosya İzinlerini Ayarlama
```bash
sudo chown -R www-data:www-data /var/www/bursaopen
sudo chmod -R 755 /var/www/bursaopen
```

## 3. Backend Kurulumu

```bash
cd /var/www/bursaopen/backend

# Bağımlılıkları yükle
npm install --production

# Production environment dosyasını düzenle
nano .env

# Aşağıdaki içeriği ekle:
PORT=5000
JWT_SECRET=güçlü-bir-secret-key-buraya-yazın
NODE_ENV=production
```

### Veritabanını Hazırlama
```bash
# Kategori tablosunu oluştur
npm run migrate:profile

# Oyuncuları yükle
npm run seed:players

# Maç programını oluştur
npm run generate:schedule

# Venue migration
npm run migrate:venue
```

### PM2 ile Backend Başlatma
```bash
pm2 start server.js --name bursaopen-backend
pm2 save
pm2 startup
```

## 4. Frontend Build ve Kurulum

```bash
cd /var/www/bursaopen/frontend

# Bağımlılıkları yükle
npm install

# Production build oluştur
npm run build

# Build dosyalarını nginx dizinine taşı
sudo mkdir -p /var/www/html/bursaopen
sudo cp -r dist/* /var/www/html/bursaopen/
```

## 5. Nginx Konfigürasyonu

### Site Konfigürasyon Dosyası Oluşturma
```bash
sudo nano /etc/nginx/sites-available/bursaopen.com
```

### Nginx Konfigürasyonu
```nginx
# Frontend - www.bursaopen.com
server {
    listen 80;
    server_name www.bursaopen.com bursaopen.com;

    # SSL için yönlendirme (Let's Encrypt sonrası)
    # return 301 https://$server_name$request_uri;

    root /var/www/html/bursaopen;
    index index.html;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend uploads
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Nginx Konfigürasyonunu Aktifleştirme
```bash
# Sembolik link oluştur
sudo ln -s /etc/nginx/sites-available/bursaopen.com /etc/nginx/sites-enabled/

# Default site'ı kaldır (isteğe bağlı)
sudo rm /etc/nginx/sites-enabled/default

# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

## 6. SSL Sertifikası Kurulumu (Let's Encrypt)

```bash
# Certbot kur
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikası al
sudo certbot --nginx -d bursaopen.com -d www.bursaopen.com

# Otomatik yenilemeyi test et
sudo certbot renew --dry-run
```

## 7. Domain DNS Ayarları (Hostinger)

Hostinger DNS yönetim panelinden:

```
A Record:
Name: @
Value: YOUR_SERVER_IP
TTL: 14400

A Record:
Name: www
Value: YOUR_SERVER_IP
TTL: 14400
```

## 8. Firewall Ayarları

```bash
# UFW firewall kur ve aktifleştir
sudo apt install ufw
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

## 9. Kontrol ve İzleme

### PM2 İle Backend Kontrolü
```bash
# Backend durumunu kontrol et
pm2 status

# Logları görüntüle
pm2 logs bursaopen-backend

# Restart
pm2 restart bursaopen-backend
```

### Nginx Kontrolü
```bash
# Nginx durumu
sudo systemctl status nginx

# Hata logları
sudo tail -f /var/log/nginx/error.log

# Access logları
sudo tail -f /var/log/nginx/access.log
```

## 10. Güncelleme Yaparken

```bash
# Backend güncellemesi
cd /var/www/bursaopen/backend
git pull  # veya dosyaları FTP ile yükle
npm install --production
pm2 restart bursaopen-backend

# Frontend güncellemesi
cd /var/www/bursaopen/frontend
git pull  # veya dosyaları FTP ile yükle
npm install
npm run build
sudo cp -r dist/* /var/www/html/bursaopen/
```

## 11. Yedekleme

### Veritabanı Yedekleme
```bash
# Otomatik yedekleme scripti
sudo nano /usr/local/bin/backup-bursaopen.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/bursaopen"
mkdir -p $BACKUP_DIR

# Database backup
cp /var/www/bursaopen/backend/tournament.db $BACKUP_DIR/tournament_$DATE.db

# Uploads backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/bursaopen/backend/uploads

# Eski yedekleri sil (30 günden eski)
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

```bash
# Script'i çalıştırılabilir yap
sudo chmod +x /usr/local/bin/backup-bursaopen.sh

# Crontab'a ekle (her gün gece 2'de)
sudo crontab -e
# Ekle: 0 2 * * * /usr/local/bin/backup-bursaopen.sh
```

## Troubleshooting

### Backend bağlantı hatası
```bash
# Backend çalışıyor mu?
pm2 status

# Port dinliyor mu?
sudo netstat -tlnp | grep :5000

# Firewall açık mı?
sudo ufw status
```

### Frontend yüklenmiyor
```bash
# Nginx çalışıyor mu?
sudo systemctl status nginx

# Dosyalar doğru yerde mi?
ls -la /var/www/html/bursaopen

# Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### SSL hatası
```bash
# Sertifika geçerli mi?
sudo certbot certificates

# Yenile
sudo certbot renew
```

## Performans Optimizasyonu

### PM2 Cluster Mode
```bash
pm2 delete bursaopen-backend
pm2 start server.js --name bursaopen-backend -i max
pm2 save
```

### Nginx Cache
Nginx konfigürasyonuna ekleyin:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m;
```

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. PM2 ve Nginx durumunu kontrol edin
3. Firewall ve DNS ayarlarını doğrulayın

## ✅ Checklist

- [ ] Node.js kuruldu
- [ ] PM2 kuruldu
- [ ] Nginx kuruldu
- [ ] Backend dosyaları yüklendi
- [ ] Backend dependencies kuruldu
- [ ] Veritabanı hazırlandı
- [ ] PM2 ile backend başlatıldı
- [ ] Frontend build alındı
- [ ] Nginx konfigürasyonu yapıldı
- [ ] DNS ayarları yapıldı
- [ ] SSL sertifikası kuruldu
- [ ] Firewall ayarlandı
- [ ] Yedekleme sistemi kuruldu
- [ ] Site test edildi

## 🎾 Başarılı Deployment!

Site artık https://www.bursaopen.com adresinden erişilebilir olmalı!
