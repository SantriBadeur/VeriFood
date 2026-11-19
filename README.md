# 🍱 VeriFood (SisaBerkah) - Food Rescue & Food Bank Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)

**VeriFood** (dikenal juga sebagai **SisaBerkah**) adalah platform manajemen bank makanan (*food bank*) dan penyelamatan makanan (*food rescue*) yang dirancang untuk menjembatani surplus makanan layak konsumsi dari donor (restoran, katering, supermarket, individu) kepada penerima manfaat yang membutuhkan (panti asuhan, komunitas, keluarga prasejahtera).

Platform ini mengintegrasikan protokol kontrol kualitas fisik, algoritma stok **FEFO (*First-Expired, First-Out*)**, logistik relawan kurir, bukti serah terima digital (**BAST / Proof of Delivery**), serta rekam jejak audit (*audit trail*) yang ketat.

---

## 🎯 Masalah yang Diselesaikan

1. **Food Waste vs. Food Insecurity**: Meminimalkan makanan berlebih yang terbuang sia-sia dengan mendistribusikannya secara tepat waktu dan aman.
2. **Kualitas & Keamanan Pangan**: Mencegah keracunan makanan melalui inspeksi fisik ketat 3 titik sebelum makanan diterima ke gudang.
3. **Risiko Makanan Basi di Gudang**: Menjamin makanan dengan masa simpan terdekat didistribusikan lebih dulu menggunakan prinsip **FEFO**.
4. **Akuntabilitas & Transparansi**: Mencatat siapa yang menerima makanan, kurir yang mengantar, penerima manfaat yang menerima, disertai foto serah terima dan tanda tangan digital.

---

## 🔄 Alur Kerja Sistem (System Workflow)

### 1. Alur Penerimaan Makanan (*Food Inbound & Quality Control*)
```
[Donatur (Restoran/Katering/Supermarket)]
                 │
                 ▼
      [Relawan / Admin Gudang]
                 │
      [Inspeksi Fisik 3 Titik]
      ├── 1. Kemasan Utuh?
      ├── 2. Suhu/Temperatur Aman?
      └── 3. Uji Visual & Bau Segar?
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  [MEMENUHI SYARAT]   [TIDAK MEMENUHI]
       │                   │
  Status: DITERIMA     Status: DITOLAK
       │              (Ditolak di awal &
       ▼               tercatat di log)
  Input ke Sistem FEFO
  + Cetak Label Rak / QR
```

### 2. Alur Pengelolaan Gudang & Algoritma FEFO
```
[Gudang Penyimpanan SisaBerkah]
                 │
                 ▼
   Algoritma FEFO Otomatis
   - Menghitung sisa masa simpan (jam/hari)
   - Mengelompokkan status: Aman | Mendekati Basi | Kritis (<4 Jam)
                 │
       ┌─────────┴─────────────────────┐
       ▼                               ▼
[Stok Aman / Diprioritaskan]   [Stok Rusak/Basi di Gudang]
       │                               │
Dialokasikan ke Jadwal             Proses Disposal / Pemusnahan
   Distribusi Terdekat             (Pencatatan Alasan & Audit Log)
```

### 3. Alur Distribusi Lapangan (*Field Logistics & BAST*)
```
[Admin Membuat Jadwal Distribusi]
  - Pilih Penerima Manfaat (Panti/Komunitas)
  - Cek Kapasitas Kuota Penerima
  - Alokasi Makanan (Rekomendasi FEFO)
  - Tugaskan Relawan Kurir
                 │
                 ▼
  Status: TERJADWAL
                 │
  [Relawan Membawa Makanan]
  - Klik Navigasi Google Maps / Kontak WA
  - Ubah Status: DIKIRIM
                 │
                 ▼
  [Serah Terima di Lokasi Penerima]
  - Verifikasi Nama Penerwakilan Penerima
  - Unggah / Ambil Foto Serah Terima
  - Tanda Tangan Digital di Layar (Canvas)
                 │
                 ▼
  Status: DITERIMA (BAST Sah)
  - Stok otomatis terpotong
  - Laporan berita acara tercatat
```

---

## 👥 Hak Akses & Peran Pengguna (User Roles)

Platform menerapkan **Role-Based Access Control (RBAC)** dengan dua peran utama:

| Fitur / Modul | Administrator (`ADMIN`) | Relawan Lapangan (`RELAWAN`) |
| :--- | :---: | :---: |
| **Dashboard Bento & Analitik** | ✅ Akses Penuh | ✅ Akses Ringkasan |
| **Input Makanan Masuk (Inbound)** | ✅ Ya | ✅ Ya |
| **Kelola Stok & Koreksi Stok** | ✅ Ya | ❌ Hanya Lihat |
| **Penghapusan Stok (Disposal)** | ✅ Ya | ❌ Tidak |
| **Buat Jadwal Distribusi** | ✅ Ya | ❌ Tidak |
| **Update Status Distribusi Lapangan** | ✅ Ya | ✅ Ya (Tugas Terkait) |
| **Input BAST (Foto & Tanda Tangan)** | ✅ Ya | ✅ Ya |
| **Kelola Master Donatur & Penerima** | ✅ Ya | ❌ Hanya Lihat Kontak |
| **Manajemen Pengguna & Akun** | ✅ Ya | ❌ Tidak |
| **Laporan & Ekspor Data (CSV/Print)** | ✅ Ya | ❌ Tidak |
| **Audit Log Trail** | ✅ Ya | ❌ Tidak |

---

## ✨ Fitur-Fitur Unggulan

### 1. 🛡️ Quality Control & Preset Kadaluarsa Cerdas
- **Checklist 3 Parameter**: Kemasan utuh, temperatur aman, visual & bau segar.
- **Shortcut Preset Kadaluarsa**:
  - `+4 Jam`: Khusus makanan bersantan/cepat basi.
  - `+8 Jam`: Pergantian shift siang ke malam.
  - `+24 Jam`: Tahan hingga esok hari.
  - `+3 Hari`: Makanan kering / kemasan pabrik.
- **Batch Intake**: Input beberapa varian makanan sekaligus dalam satu nota donasi.

### 2. ⚡ Sistem Distribusi & BAST Digital
- **Penugasan Kurir**: Setiap distribusi dapat ditugaskan ke relawan kurir tertentu.
- **Tanda Tangan Digital Langsung**: Menggunakan canvas interaktif tanpa perlu cetak kertas manual.
- **Bukti Foto Serah Terima**: Relawan dapat langsung mengambil/mengunggah foto bukti penerimaan di lokasi.
- **Quick Actions Kontak**: Tombol sekali klik untuk membuka WhatsApp (`wa.me`) dan rute Google Maps langsung dari aplikasi.

### 3. 🔍 Pelacakan Jejak Audit (*Audit Trail & Diff Viewer*)
- Setiap perubahan data krusial (koreksi jumlah stok, disposal makanan basi, pergantian status pengiriman) tercatat otomatis di `AuditLog` dengan perbandingan nilai sebelum dan sesudah (*diff viewer*).

### 4. 📱 Mobile First & Desain Vertix Bento
- Desain antarmuka modern dengan gaya **Bento Grid**, dock mengambang (*floating dock*), dan bilah navigasi bawah (*bottom navigation*) untuk penggunaan optimal dengan satu tangan oleh relawan di lapangan.
- **Command Palette (`Ctrl + K`)**: Navigasi cepat dan pencarian modul instan.
- **Dark Mode & Light Mode**: Dukungan tema gelap/terang otomatis yang nyaman di mata.

### 5. 📡 Kesiapan Offline (PWA)
- Terintegrasi dengan Service Worker dan antrean penyimpanan lokal (`localStorage queue`) sehingga data input relawan tetap aman tersimpan saat sinyal internet terputus di lapangan.

---

## 🛠️ Tech Stack & Arsitektur

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS 3.4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & ORM**: [Prisma ORM 6.4](https://www.prisma.io/) dengan database [SQLite](https://www.sqlite.org/)
- **Autentikasi**: JWT (JSON Web Token) dengan HttpOnly Cookies & Bcrypt Password Hashing
- **Testing**: [Vitest](https://vitest.dev/) (Unit, Integration, & E2E API Tests)

---

## 📁 Struktur Direktori Proyek

```text
├── prisma/
│   ├── schema.prisma       # Skema database SQLite & relasi model
│   └── seed.ts             # Data awal demo (Admin, Relawan, Donatur, Stok)
├── public/                 # Aset publik, manifest PWA & service worker
├── src/
│   ├── app/
│   │   ├── (auth)/         # Halaman login, register, reset password
│   │   ├── (dashboard)/    # Halaman internal (dashboard, distribusi, makanan, dll)
│   │   ├── api/            # Route Handlers Next.js (REST API backend)
│   │   ├── globals.css     # Styling global & token warna Vertix UI
│   │   └── layout.tsx      # Root layout & providers
│   ├── components/         # Komponen UI modular (Modal, BAST, Bento, Dock)
│   ├── lib/                # Helper utilities (auth, db prisma, fefo, offline queue)
│   ├── middleware.ts       # Route guard middleware berbasis JWT cookie
│   └── services/           # Business logic & repository layer
├── tests/                  # Test suite Vitest (pengujian unit, auth, RBAC, API)
├── package.json
└── run-demo.bat            # Script otomatis untuk menjalankan demo di Windows
```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18.18 atau lebih baru.
- npm atau yarn / pnpm.

### 1. Clone Repository
```bash
git clone https://github.com/SantriBadeur/VeriFood.git
cd VeriFood
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Buat file `.env` di root direktori proyek:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="kunci_rahasia_jwt_anda_disini"
```

### 4. Setup Database & Jalankan Seed
```bash
npx prisma db push
npx prisma db seed
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di alamat: **[http://localhost:3000](http://localhost:3000)**.

> 💡 **Pengguna Windows**: Cukup klik dua kali pada file `run-demo.bat` untuk menyiapkan dependensi, database, build, dan membuka browser secara otomatis.

---

## 🔑 Akun Uji Coba (Demo Credentials)

Gunakan akun bawaan dari *seeding* berikut untuk mengeksplorasi fitur:

| Peran | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@sisaberkah.org` | `admin123` | Akses penuh seluruh fitur & laporan |
| **Relawan Lapangan** | `relawan@sisaberkah.org` | `relawan123` | Inbound pangan & distribusi kurir BAST |

---

## 🧪 Menjalankan Pengujian Otomatis (Tests)

Platform ini dilengkapi dengan pengujian komprehensif menggunakan Vitest:
```bash
npm run test
```

---

## 📄 Lisensi
Proyek ini dikembangkan untuk tujuan sosial, kemanusiaan, dan edukasi pengelolaan bank makanan berkelanjutan.
