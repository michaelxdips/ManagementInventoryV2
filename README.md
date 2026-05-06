<div align="center">
  <img src="./frontend/public/logo.png" alt="Logo" width="120" />
  <h1>📦 Management Inventory ATK</h1>
  <p>💡 <i>Sistem Cerdas Pengelolaan Alat Tulis Kantor (ATK) Berbasis Web</i></p>

  <p>
    <img src="https://img.shields.io/badge/Status-Final_RC-success?style=for-the-badge" alt="Status" />
    <img src="https://img.shields.io/badge/Stack-React_|_Node_|_MySQL-blue?style=for-the-badge&logo=react" alt="Tech Stack" />
    <img src="https://img.shields.io/badge/License-PKL-orange?style=for-the-badge" alt="License" />
  </p>
</div>

---

## 🎯 Tentang Proyek

Sistem Informasi Manajemen Inventaris ATK adalah solusi digital komprehensif yang memodernisasi cara perusahaan mencatat persediaan, mengelola barang masuk, dan memproses permintaan dari setiap divisi. Dilengkapi dengan lapisan keamanan mutakhir dan notifikasi _real-time_, sistem ini mencegah inkonsistensi data serta memberikan pengalaman luar biasa, baik di _desktop_ maupun ponsel.

---

## ✨ Fitur-Fitur Unggulan

### 🔐 Keamanan & Autentikasi
- **Role-Based Access Control (RBAC)** - Tiga tingkat akses: Superadmin, Admin (Operasional), dan User (Pemohon)
- **JWT Authentication** - Token berbasis _stateless_ dengan enkripsi Bcrypt untuk keamanan maksimal
- **Rate Limiting & Helmet.js** - Perlindungan dari serangan brute force dan XSS
- **Audit Logging** - Setiap transaksi tercatat lengkap dengan timestamp dan user yang melakukan

### 📊 Manajemen Inventory
- **Master Data ATK** - CRUD lengkap untuk katalog barang dengan kode, nama, satuan, lokasi simpan, dan stok minimum
- **Zero-Minus Stock Guarantee** - Database transactions dan row-level locking mencegah stok negatif
- **Peringatan Stok Kritis** - Indikator visual otomatis saat stok mencapai batas minimum
- **Barang Kosong** - Daftar khusus untuk barang dengan stok habis (qty = 0)
- **Stock Opname** - Sistem penghitungan fisik stok dengan snapshot, adjustment, dan finalisasi

### 📥 Barang Masuk
- **Pencatatan Barang Masuk** - Input barang baru atau penambahan stok barang existing
- **Auto-Update Inventory** - Stok otomatis bertambah saat barang masuk dicatat
- **History Barang Masuk** - Riwayat lengkap dengan filter tanggal dan PIC
- **Bulk Import Excel** - Upload data barang masuk dalam jumlah besar via file Excel

### 📤 Permintaan Barang (Request)
- **Request Ambil Barang** - User dapat mengajukan permintaan barang yang sudah ada di inventory
- **Request Barang Baru** - User dapat mengajukan barang yang belum ada di katalog
- **Approval Workflow** - Alur persetujuan dua tahap: Review → Finalize
- **Status Tracking** - PENDING → APPROVAL_REVIEW → APPROVED/REJECTED
- **Notifikasi Real-Time** - Admin dan User mendapat update status secara instant via SSE
- **Calendar View** - Visualisasi permintaan dalam bentuk kalender

### ✅ Approval & Finalisasi
- **Review Request** - Admin dapat menandai request untuk direview lebih lanjut
- **Finalize Approval** - Validasi stok, pengurangan qty, dan pencatatan barang keluar otomatis
- **Reject Request** - Penolakan dengan alasan yang dapat dicatat
- **Stock Validation** - Sistem memastikan stok cukup sebelum approval
- **Barang Keluar Auto-Generated** - Setiap approval otomatis mencatat transaksi keluar

### 📤 History Barang Keluar
- **Riwayat Lengkap** - Semua transaksi barang keluar dengan detail penerima dan departemen
- **Filter & Export** - Filter berdasarkan tanggal, export ke Excel dan PDF
- **Link ke Request** - Setiap barang keluar terhubung dengan request aslinya

### 🔔 Notifikasi Real-Time (SSE)
- **Server-Sent Events** - Push notification tanpa polling, hemat bandwidth
- **Persistent Notifications** - Notifikasi tersimpan di database untuk history
- **Multi-Channel** - Notifikasi di aplikasi + email (opsional)
- **Smart Routing** - Admin menerima notif request baru, User menerima notif status approval
- **Low Stock Alerts** - Admin otomatis diberitahu saat stok menipis

### 📢 Pengumuman (Announcements)
- **Broadcast Message** - Admin dapat membuat pengumuman untuk semua user
- **Active/Inactive Toggle** - Kontrol visibilitas pengumuman
- **Rich Content** - Judul dan konten lengkap dengan timestamp

### 👥 Manajemen User
- **User CRUD** - Superadmin dapat mengelola akun user (create, update, delete)
- **Unit/Departemen** - Pengelolaan unit organisasi untuk kategorisasi user
- **Profile Settings** - User dapat mengubah nama dan informasi profil
- **Password Management** - Ubah password dengan validasi password lama

### 📈 Dashboard & Analytics
- **Admin Dashboard** - Statistik stok, request pending, low stock items, dan grafik trend
- **User Dashboard** - Status request pribadi, pengumuman, dan quick actions
- **Stock Prediction** - Prediksi kebutuhan stok berdasarkan historical data
- **Visual Charts** - Grafik interaktif menggunakan Recharts

### 📱 Mobile-First Design
- **Responsive Layout** - Otomatis beradaptasi dari desktop ke mobile
- **Card View Mobile** - Tampilan kartu yang rapi untuk layar kecil
- **Bottom Navigation** - Navigasi mudah dijangkau di ponsel
- **Drawer Menu** - Side menu yang smooth untuk akses cepat
- **Touch-Optimized** - Tombol dan interaksi dioptimalkan untuk sentuhan

### 🎨 User Experience
- **Dark/Light Mode** - Toggle tema sesuai preferensi user
- **Loading Skeletons** - Placeholder animasi saat loading data
- **Toast Notifications** - Feedback visual untuk setiap aksi
- **Confirm Dialogs** - Konfirmasi untuk aksi penting (delete, reject, dll)
- **Empty States** - Ilustrasi dan pesan informatif saat data kosong
- **Error Boundaries** - Graceful error handling di frontend

### 📄 Export & Reporting
- **Export Excel** - Export data ke format .xlsx dengan styling
- **Export PDF** - Generate laporan PDF dengan jsPDF dan autoTable
- **QR Code Generation** - Generate QR code untuk tracking barang
- **Print-Friendly** - Layout optimized untuk print

### 🔍 Audit & Compliance
- **Comprehensive Audit Logs** - Setiap CREATE, UPDATE, DELETE tercatat
- **Old/New Values** - Snapshot data sebelum dan sesudah perubahan
- **User Attribution** - Siapa yang melakukan aksi dan kapan
- **Filter & Search** - Cari audit log berdasarkan tabel, aksi, tanggal, atau user
- **Pagination** - Navigasi audit log yang efisien

---

## 🛠️ Arsitektur Teknologi

Dibangun menggunakan standar industri terkini untuk memastikan performa maksimal dan kemudahan _maintenance_:

### Backend Stack
| Komponen       | Teknologi                  | Keterangan                                                                     |
| :------------- | :------------------------- | :----------------------------------------------------------------------------- |
| **Runtime**    | 🟢 Node.js 18+             | JavaScript runtime yang cepat dan scalable                                     |
| **Framework**  | 🚂 Express.js 4.21         | RESTful API server yang tangguh dan minimalis                                  |
| **Database**   | 🐬 MySQL 8 (Aiven Cloud)   | Relational database dengan ACID transactions                                   |
| **ORM**        | 🔧 Knex.js 3.1             | Query builder dan migration tool yang powerful                                 |
| **Auth**       | 🔑 JWT + Bcrypt            | Stateless authentication dengan password hashing                               |
| **Security**   | 🛡️ Helmet + Rate Limiter   | HTTP headers security dan API rate limiting                                    |
| **Email**      | 📧 Nodemailer              | Email notifications untuk events penting                                       |
| **File Upload**| 📎 Multer                  | Multipart form-data handling untuk Excel import                                |
| **Excel**      | 📊 XLSX                    | Read/write Excel files untuk bulk import/export                                |
| **Testing**    | ✅ Vitest + Supertest      | Unit dan integration testing dengan coverage                                   |
| **API Docs**   | 📖 Swagger                 | Interactive API documentation                                                  |

### Frontend Stack
| Komponen       | Teknologi                  | Keterangan                                                                     |
| :------------- | :------------------------- | :----------------------------------------------------------------------------- |
| **Framework**  | ⚛️ React 19                | UI library dengan concurrent features terbaru                                  |
| **Build Tool** | ⚡ Vite 6                  | Lightning-fast build tool dengan HMR                                           |
| **Language**   | 📘 TypeScript 5.7          | Type-safe JavaScript untuk maintainability                                     |
| **Routing**    | 🛣️ React Router 7          | Client-side routing dengan nested routes                                       |
| **Icons**      | 🎨 Lucide React            | Beautiful & consistent icon set                                                |
| **Charts**     | 📊 Recharts                | Composable charting library untuk visualisasi data                             |
| **PDF**        | 📄 jsPDF + autoTable       | Client-side PDF generation                                                     |
| **Excel**      | 📊 XLSX                    | Client-side Excel generation                                                   |
| **QR Code**    | 📱 react-qr-code           | QR code generation untuk tracking                                              |
| **PWA**        | 📲 vite-plugin-pwa         | Progressive Web App support dengan offline capability                          |
| **Testing**    | ✅ Vitest                  | Fast unit testing framework                                                    |

### DevOps & Tools
| Komponen       | Teknologi                  | Keterangan                                                                     |
| :------------- | :------------------------- | :----------------------------------------------------------------------------- |
| **Container**  | 🐳 Docker                  | Containerization untuk consistency across environments                         |
| **CI/CD**      | 🔄 GitHub Actions          | Automated testing dan deployment pipeline                                      |
| **Linting**    | 🔍 ESLint + Prettier       | Code quality dan formatting consistency                                        |
| **Git**        | 🌿 Git + GitHub            | Version control dan collaboration                                              |

---

## 🚀 Panduan Instalasi

### Prasyarat
- **Node.js** v18 atau lebih tinggi
- **MySQL** 8.0 atau lebih tinggi (atau akses ke MySQL cloud seperti Aiven)
- **npm** atau **yarn** package manager

### 1. Clone Repository

```bash
git clone https://github.com/michaelxdips/ManagementInventoryV2.git
cd ManagementInventoryV2
```

### 2. Setup Backend

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Edit .env dengan kredensial database Anda
# PORT=3000
# JWT_SECRET=your-secret-key
# DB_HOST=your-mysql-host
# DB_PORT=3306
# DB_USER=your-username
# DB_PASSWORD=your-password
# DB_NAME=your-database-name

# Jalankan migrasi database
npm run migrate

# (Opsional) Seed data sample
npm run seed

# Jalankan development server
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

### 3. Setup Frontend

```bash
cd frontend
npm install

# Copy environment template
cp .env.example .env

# Edit .env dengan URL backend Anda
# VITE_API_URL=http://localhost:3000/api

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### 4. Setup Database (Manual)

Jika Anda ingin setup database secara manual:

```sql
CREATE DATABASE inventory_management;
USE inventory_management;

-- Jalankan migration files di backend/src/migrations/ secara berurutan
-- Atau gunakan: npm run migrate
```

---

## 🐳 Instalasi dengan Docker

```bash
# Build dan jalankan semua services
docker-compose up -d

# Jalankan migrasi
docker-compose exec backend npm run migrate

# Lihat logs
docker-compose logs -f
```

---

## 📚 Struktur Database

### Tabel Utama

- **users** - Data user dengan role (superadmin, admin, user)
- **units** - Unit/departemen organisasi
- **atk_items** - Master data inventory ATK
- **requests** - Permintaan ambil barang (existing items)
- **item_requests_new** - Permintaan barang baru (belum ada di inventory)
- **barang_masuk** - History barang masuk
- **barang_keluar** - History barang keluar
- **stock_opname** - Session stock opname
- **stock_opname_items** - Detail item per session opname
- **announcements** - Pengumuman untuk user
- **user_notifications** - Notifikasi persistent per user
- **audit_logs** - Comprehensive audit trail

---

## 🔑 Mode Demo: Akun Tersedia

Gunakan _credentials_ di bawah ini untuk mencoba berbagai tingkatan akses:

| Akses Pengguna | Username     | Password   | Hak Akses                                                                                    |
| :------------- | :----------- | :--------- | :------------------------------------------------------------------------------------------- |
| **Superadmin** | `superadmin` | `admin123` | ✨ Full access: Manajemen user, unit, inventory, approval, audit logs, dan semua fitur       |
| **Admin**      | `admin`      | `admin123` | 📦 Operasional: Tambah stok, approve request, stock opname, barang masuk/keluar, pengumuman |
| **User**       | `user`       | `user123`  | 👤 Basic: Lihat katalog, request barang (existing & baru), lihat status request pribadi     |

---

## 📖 API Documentation

Setelah backend berjalan, akses Swagger API documentation di:

```
http://localhost:3000/api-docs
```

### Endpoint Utama

#### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

#### Items (Inventory)
- `GET /api/items` - List semua barang
- `POST /api/items` - Tambah barang baru (admin)
- `PUT /api/items/:id` - Update barang (admin)
- `DELETE /api/items/:id` - Hapus barang (superadmin)

#### Requests (Ambil Barang)
- `GET /api/requests` - List requests
- `POST /api/requests` - Buat request baru (user)
- `GET /api/requests/:id` - Detail request

#### Approval
- `GET /api/approval` - List pending requests (admin)
- `POST /api/approval/:id/review` - Mark untuk review (admin)
- `POST /api/approval/:id/finalize` - Finalize approval (admin)
- `POST /api/approval/:id/reject` - Reject request (admin)

#### New Item Requests
- `GET /api/new-item-requests` - List request barang baru
- `POST /api/new-item-requests` - Request barang baru (user)
- `POST /api/new-item-requests/:id/approve` - Approve & create item (admin)
- `POST /api/new-item-requests/:id/reject` - Reject request (admin)

#### Barang Masuk
- `GET /api/barang-masuk` - History barang masuk
- `POST /api/barang-masuk` - Catat barang masuk (admin)

#### History
- `GET /api/history/masuk` - History barang masuk
- `GET /api/history/keluar` - History barang keluar

#### Stock Opname
- `GET /api/opname` - List opname sessions
- `POST /api/opname` - Create draft session (admin)
- `PUT /api/opname/:id/items/:itemId` - Update physical qty
- `POST /api/opname/:id/finalize` - Finalize opname (admin)

#### Notifications
- `GET /api/notifications/stream` - SSE endpoint (real-time)
- `GET /api/notifications/inbox` - Persistent notifications
- `PATCH /api/notifications/inbox/:id/read` - Mark as read
- `DELETE /api/notifications/inbox` - Clear all

#### Announcements
- `GET /api/announcements/active` - Active announcements
- `GET /api/announcements` - All announcements (admin)
- `POST /api/announcements` - Create announcement (admin)
- `PATCH /api/announcements/:id` - Update announcement (admin)
- `DELETE /api/announcements/:id` - Delete announcement (admin)

#### Users & Units
- `GET /api/users` - List users (superadmin)
- `POST /api/users` - Create user (superadmin)
- `PUT /api/users/:id` - Update user (superadmin)
- `DELETE /api/users/:id` - Delete user (superadmin)
- `GET /api/units` - List units
- `POST /api/units` - Create unit (admin)

#### Audit Logs
- `GET /api/audit` - List audit logs dengan filter (admin)

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run smoke test
npm run test
```

---

## 🎨 Fitur UI/UX

### Responsive Breakpoints
- **Mobile**: < 768px (Card view, bottom nav)
- **Tablet**: 768px - 1024px (Hybrid layout)
- **Desktop**: > 1024px (Sidebar + table view)

### Theme Support
- **Light Mode** - Default, clean dan professional
- **Dark Mode** - Eye-friendly untuk penggunaan malam

### Accessibility
- Semantic HTML
- ARIA labels untuk screen readers
- Keyboard navigation support
- Focus indicators yang jelas

---

## 📊 Workflow Bisnis

### Alur Request Barang Existing

1. **User** membuat request via "Ambil Barang" → Status: `PENDING`
2. **Admin** melihat di halaman Approval
3. **Admin** klik "Review" → Status: `APPROVAL_REVIEW`
4. **Admin** masuk ke halaman Finalize, validasi qty
5. **Admin** klik "Finalize" → Status: `APPROVED`
   - Stok berkurang
   - Barang keluar tercatat
   - User dapat notifikasi
6. Atau **Admin** klik "Reject" → Status: `REJECTED`
   - Stok tidak berubah
   - User dapat notifikasi dengan alasan

### Alur Request Barang Baru

1. **User** request barang yang belum ada → Status: `PENDING`
2. **Admin** review di "Request Barang Baru"
3. **Admin** approve dengan qty awal → Status: `APPROVED`
   - Item baru dibuat di inventory
   - Barang masuk tercatat
   - User dapat notifikasi
4. Atau **Admin** reject dengan alasan → Status: `REJECTED`

### Alur Stock Opname

1. **Admin** buat session opname → Status: `DRAFT`
   - Snapshot semua item saat ini
2. **Admin** input physical qty untuk setiap item
3. **Admin** finalize → Status: `FINALIZED`
   - Stok di inventory diupdate sesuai physical qty
   - Difference tercatat di audit log
   - Email notification dikirim

---

## 🔒 Security Best Practices

- ✅ Password di-hash dengan Bcrypt (salt rounds: 10)
- ✅ JWT token dengan expiry time
- ✅ Rate limiting untuk prevent brute force
- ✅ Helmet.js untuk secure HTTP headers
- ✅ Input validation dan sanitization
- ✅ SQL injection prevention via parameterized queries
- ✅ CORS configuration untuk trusted origins
- ✅ Environment variables untuk sensitive data
- ✅ File upload validation (type, size, extension)
- ✅ Role-based authorization di setiap endpoint

---

## 🚧 Troubleshooting

### Backend tidak bisa connect ke database
```bash
# Cek koneksi MySQL
mysql -h your-host -u your-user -p

# Pastikan .env sudah benar
cat backend/.env

# Test koneksi
node backend/src/config/db.js
```

### Frontend tidak bisa hit API
```bash
# Cek VITE_API_URL di frontend/.env
cat frontend/.env

# Pastikan backend sudah running
curl http://localhost:3000/api/auth/me
```

### Migration error
```bash
# Rollback migration
npm run migrate:rollback

# Check migration status
npm run migrate:status

# Re-run migration
npm run migrate
```

### Port sudah digunakan
```bash
# Ubah PORT di backend/.env
PORT=3001

# Atau kill process yang menggunakan port
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

---

## 📝 Changelog

### Version 1.0.0 (Final RC)
- ✅ Complete CRUD untuk semua entitas
- ✅ Real-time notifications via SSE
- ✅ Stock opname dengan finalization
- ✅ Request barang baru (separate dari ambil barang)
- ✅ Comprehensive audit logging
- ✅ Mobile-responsive design
- ✅ Dark/Light theme
- ✅ Export Excel & PDF
- ✅ Email notifications
- ✅ Unit testing dengan coverage
- ✅ API documentation dengan Swagger
- ✅ Docker support
- ✅ GitHub Actions CI/CD

---

## 🤝 Contributing

Contributions are welcome! Untuk berkontribusi:

1. Fork repository ini
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

Project ini dibuat untuk keperluan PKL (Praktik Kerja Lapangan) - 2026

---

## 👥 Tim Pengembang

<div align="center">
  <b>Developed for PKL Project - 2026</b><br/>
  <i>Stephen Michael dan Zaky Musyaffa</i>
</div>
