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

## ✨ Fitur-Fitur Unggulan

🛡️ **Manajemen Stok Terjamin (Zero-Minus)**
Setiap transaksi dibungkus dalam _Database Transactions_ dan _Row-Level Locking_, menjamin stok tidak akan pernah "minus" walau diakses ratusan pengguna secara serentak.

⚡ **Notifikasi Real-Time (SSE)**
Semua _Request_ baru dan perubahan status (Disetujui/Ditolak) akan langsung muncul di layar _Admin_ maupun _User_ dalam hitungan milidetik tanpa perlu me-_refresh_ halaman.

🚨 **Peringatan Stok Kritis**
Indikator warna cerdas akan otomatis menyala di tabel _Inventory_ jika ada stok barang yang menyentuh batas minimum, memperingatkan Admin untuk segera melakukan pemesanan ulang (_restock_).

📱 **Desain Mobile-First & Responsif**
_Layout_ otomatis beradaptasi menjadi _Card View_ super rapi di layar ponsel, lengkap dengan navigasi _Drawer Menu_ yang intuitif untuk kemudahan akses di lapangan.

🔒 **Role-Based Access Control (RBAC)**
Pengaturan hak akses terpusat antara **Superadmin**, **Admin (Operasional)**, dan **User (Pemohon)** dengan pengamanan API ketat di sisi _backend_.

## 🛠️ Arsitektur Teknologi

Dibangun menggunakan standar industri terkini untuk memastikan performa maksimal dan kemudahan _maintenance_:

| Komponen       | Teknologi            | Keterangan                                                                     |
| :------------- | :------------------- | :----------------------------------------------------------------------------- |
| **Frontend**   | ⚛️ React 19 + Vite   | UI dinamis, sangat reaktif, didukung _Custom Hooks_ & _CSS Modules_.           |
| **Backend**    | 🟢 Node.js + Express | RESTful API server yang tangguh, merespons asinkronus, dan aman.               |
| **Database**   | 🐬 MySQL (Aiven)     | Relational DB di _Cloud_ guna menjaga _ACID Transactions_.                     |
| **Security**   | 🔑 JWT + Bcrypt      | _Stateless Authentication_ dengan skema _hashing_ kata sandi kuat.             |
| **Deployment** | 🐳 Docker            | _Containerization_ mulus untuk isolasi lingkungan pengembangan yang konsisten. |

## 🚀 Panduan Instalasi (Lokal)

Sistem membutuhkan **Node.js v18+** dan **MySQL Server**.

### 1. Konfigurasi Backend

```bash
cd backend
npm install
cp .env.example .env
# Isi kredensial database Anda di file .env
npm run dev
```

### 2. Konfigurasi Frontend

```bash
cd frontend
npm install
npm run dev
```

_Aplikasi web Anda akan menyala di `http://localhost:5173`._

---

## 🔑 Mode Demo: Akun Tersedia

Gunakan _credentials_ di bawah ini untuk mencoba berbagai tingkatan akses:

| Akses Pengguna | Username     | Password   | Tipe Kekuasaan                                            |
| :------------- | :----------- | :--------- | :-------------------------------------------------------- |
| **Superadmin** | `superadmin` | `admin123` | ✨ _God Mode_ (Manajemen User & Ubah Detail Katalog)      |
| **Admin**      | `admin`      | `admin123` | 📦 _Operasional_ (Tambah Stok Master & _Approve_ Request) |
| **User**       | `user`       | `user123`  | 👤 _Basic Access_ (Melihat Katalog Stok & Meminta Barang) |

---

<div align="center">
  <b>Developed for PKL Project - 2026</b><br/>
  <i>Stephen Michael dan Zaky Musyaffa</i>
</div>
