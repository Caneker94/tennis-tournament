# Tenis Turnuvası Yönetim Sistemi

Modern, kullanıcı dostu tenis turnuvası yönetim platformu. Turnuva organizatörleri için kapsamlı admin paneli, oyuncular için skor girişi ve herkes için canlı puan takibi.

## Özellikler

### Genel Özellikler
- 📊 Canlı puan durumu takibi
- 📅 Haftalık maç programları
- 🏆 Kategori ve grup bazlı organizasyon
- 📱 Responsive tasarım (mobil uyumlu)
- 🎯 Sponsor yönetimi ve gösterimi

### Kategoriler
**Erkekler:**
- Elite
- Master
- Rising

**Kadınlar:**
- Master
- Rising

### Puanlama Sistemi
- **Galibiyet:** 3 puan
- **Mağlubiyet:** 1 puan
- **Walkover (maça çıkmama):** 0 puan

### Admin Paneli
- Kullanıcı yönetimi (oyuncu hesapları oluşturma)
- Kategori ve grup yönetimi
- Maç programı oluşturma
- Sponsor yönetimi
- Tam kontrol ve düzenleme yetkisi

### Oyuncu Özellikleri
- Kendi maçlarını görüntüleme
- Maç skorlarını girme (2 set + süper tie break)
- Walkover bildirimi
- Geçmiş maç kayıtları

## Teknoloji Yığını

### Backend
- Node.js
- Express.js
- SQLite3
- JWT Authentication
- bcryptjs

### Frontend
- React 18
- Vite
- React Router
- Axios
- CSS3

## Kurulum

### Gereksinimler
- Node.js 16+
- npm veya yarn

### Backend Kurulumu

1. Backend klasörüne gidin:
```bash
cd tennis-tournament/backend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Veritabanını başlatın ve ilk admin kullanıcısını oluşturun:
```bash
npm run seed
```

Bu komut şunları yapacaktır:
- Veritabanı tablolarını oluşturur
- İlk admin kullanıcısını ekler (Kullanıcı adı: `admin`, Şifre: `admin123`)
- Örnek kategorileri oluşturur

4. Backend sunucusunu başlatın:
```bash
npm run dev
```

Backend varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.

### Frontend Kurulumu

1. Yeni bir terminal açın ve frontend klasörüne gidin:
```bash
cd tennis-tournament/frontend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Development sunucusunu başlatın:
```bash
npm run dev
```

Frontend varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

## Kullanım

### İlk Giriş

1. Tarayıcınızda `http://localhost:3000` adresine gidin
2. "Giriş Yap" butonuna tıklayın
3. Varsayılan admin bilgileri ile giriş yapın:
   - **Kullanıcı Adı:** admin
   - **Şifre:** admin123
   - ⚠️ **Güvenlik için bu şifreyi hemen değiştirin!**

### Admin İşlemleri

#### 1. Kullanıcı (Oyuncu) Oluşturma
1. Admin Panel → Kullanıcılar
2. "Yeni Kullanıcı" butonuna tıklayın
3. Kullanıcı bilgilerini girin
4. Kullanıcı adı ve şifreyi oyuncuya verin

#### 2. Grup Oluşturma ve Oyuncu Atama
1. Admin Panel → Gruplar
2. "Yeni Grup" ile grup oluşturun
3. Oluşturulan grubun "Oyuncular" butonuna tıklayın
4. Maksimum 8 oyuncu ekleyin

#### 3. Maç Programı Oluşturma
1. Admin Panel → Maç Programı
2. "Yeni Maç Ekle" butonuna tıklayın
3. Grup, oyuncular, tarih ve hafta bilgilerini girin

#### 4. Sponsor Ekleme
1. Admin Panel → Sponsorlar
2. "Yeni Sponsor Ekle" butonuna tıklayın
3. Sponsor bilgilerini ve logo URL'ini girin
4. Sponsor logoları ana sayfada otomatik görünür

### Oyuncu İşlemleri

#### Maç Skoru Girme
1. "Maçlarım" sayfasına gidin
2. Skor girilmemiş maçın yanındaki "Skor Gir" butonuna tıklayın
3. Set skorlarını girin
4. Gerekirse süper tie break skorunu ekleyin
5. Walkover durumunda ilgili checkbox'ı işaretleyin

#### Puan Durumunu Görüntüleme
"Puan Durumu" sayfasından tüm kategorilerde güncel sıralamaları görebilirsiniz.

## Proje Yapısı

```
tennis-tournament/
├── backend/
│   ├── database.js          # Veritabanı şeması ve bağlantı
│   ├── server.js            # Ana Express sunucusu
│   ├── seed.js              # İlk veri oluşturma
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   └── routes/
│       ├── auth.js          # Giriş/çıkış endpoints
│       ├── admin.js         # Admin işlemleri
│       ├── matches.js       # Maç işlemleri
│       ├── standings.js     # Puan durumu
│       └── sponsors.js      # Sponsor işlemleri
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── admin/       # Admin panel komponentleri
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Standings.jsx
    │   │   ├── Schedule.jsx
    │   │   ├── MyMatches.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── utils/
    │   │   ├── api.js       # Axios instance
    │   │   └── AuthContext.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── vite.config.js
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Giriş yap
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Admin (Yetki gerektirir)
- `GET/POST /api/admin/users` - Kullanıcı yönetimi
- `GET/POST /api/admin/categories` - Kategori yönetimi
- `GET/POST /api/admin/groups` - Grup yönetimi
- `GET/POST /api/admin/matches` - Maç yönetimi
- `GET/POST/PUT/DELETE /api/admin/sponsors` - Sponsor yönetimi

### Public
- `GET /api/matches` - Tüm maçlar
- `GET /api/standings` - Puan durumu
- `GET /api/sponsors` - Aktif sponsorlar

### Player (Giriş gerektirir)
- `GET /api/matches/my-matches` - Kendi maçlarım
- `POST /api/matches/:id/score` - Skor gir

## Güvenlik

- JWT token tabanlı authentication
- Şifreler bcrypt ile hashlenmiş
- Admin/Player rol bazlı yetkilendirme
- CORS koruması
- SQL injection koruması (parameterized queries)

## Production'a Hazırlama

### Backend

1. Environment değişkenlerini ayarlayın:
```env
PORT=5000
JWT_SECRET=your-very-secure-secret-key
NODE_ENV=production
```

2. Production build:
```bash
npm start
```

### Frontend

1. Production build oluşturun:
```bash
npm run build
```

2. `dist` klasörünü bir web sunucusunda (nginx, Apache, vb.) host edin

## Sorun Giderme

### Backend başlamıyor
- Node.js versiyonunu kontrol edin (16+)
- `npm install` komutunu tekrar çalıştırın
- Port 5000'in kullanılmadığından emin olun

### Frontend backend'e bağlanamıyor
- Backend sunucusunun çalıştığından emin olun
- CORS ayarlarını kontrol edin
- Tarayıcı konsolunda hata mesajlarını inceleyin

### Giriş yapılamıyor
- `npm run seed` komutunu çalıştırdığınızdan emin olun
- Varsayılan kullanıcı: `admin` / `admin123`

## Geliştirme Planı

- [ ] E-posta bildirimleri
- [ ] PDF maç programı export
- [ ] İstatistik grafikleri
- [ ] Oyuncu profil sayfaları
- [ ] Maç yorumları/notlar
- [ ] Multi-tournament desteği

## Lisans

MIT

## Destek

Sorularınız için lütfen bir issue açın.
