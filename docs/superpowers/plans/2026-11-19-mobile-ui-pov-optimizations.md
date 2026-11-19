# Mobile UI & POV Relawan Lapangan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengoptimalkan tampilan dan interaksi UI untuk relawan lapangan & kurir yang mengakses web dari ponsel cerdas (layar 360px–414px): (1) Mobile Card Stack untuk tabel di `/makanan/kelola`, (2) Mobile Card Stack untuk tabel di `/donatur`, `/penerima`, `/pengguna`, (3) Header responsif anti-overflow untuk layar sempit 360px di `top-header.tsx`, (4) Modal BAST `ProofOfDeliveryModal.tsx` dengan kontainer anti-terpotong keyboard virtual `max-h-[85vh] overflow-y-auto`, dan (5) Konsolidasi tautan navigasi Google Maps ganda di kartu distribusi `/distribusi`.

**Architecture:**
1. **Mobile Card Stack:** Menggantikan tabel desktop lebar (>750px) dengan tata letak kartu susun vertikal pada breakpoint mobile (`< 768px` via `block md:hidden`), sementara tabel multi-kolom hanya ditampilkan pada layar desktop (`hidden md:table` atau `hidden md:block`). Kartu mobile menampilkan data secara hierarkis dengan target sentuh tombol aksi yang nyaman ($\ge 44$px).
2. **Compact Mobile Header:** Memperbarui `TopHeader` agar pada layar $\le 360$px (seperti Galaxy S8 / iPhone SE), profil pengguna menampilkan avatar bulat dengan tooltip/title nama, menyembunyikan teks nama panjang (`hidden sm:flex flex-col`), serta membatasi lebar dropdown lonceng dengan `w-[calc(100vw-1.5rem)] max-w-sm sm:w-96` untuk mencegah horizontal bleed.
3. **Resilient Virtual Keyboard Modal:** Mengatur kontainer modal BAST serah terima di `ProofOfDeliveryModal.tsx` menjadi `max-h-[85vh] flex flex-col` dengan header `flex-shrink-0`, body form yang dapat di-scroll secara vertikal (`flex-1 overflow-y-auto`), dan footer tombol aksi yang tetap dapat diakses saat keyboard virtual terbuka.
4. **Unified Courier Navigation Button:** Menghapus tautan ganda yang membingungkan pada kartu distribusi di `/distribusi/page.tsx` dengan menggabungkannya menjadi 1 tombol tunggal yang jelas dan ramah sentuhan: "🧭 Rute Navigasi" yang langsung membuka petunjuk arah turn-by-turn via `getGoogleNavigationUrl()`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Vitest.

**Spec:** POV Relawan & Kurir Mobile (Layar 360px–414px):
- Masalah A: Tabel Desktop Memaksa Horizontal Scroll di `/makanan/kelola`, `/donatur`, `/penerima`, `/pengguna`.
- Masalah B: Header Padat dan Rawan Terpotong di Layar 360px (`top-header.tsx`).
- Masalah C: Modal BAST Tanda Tangan Memiliki Risiko Terpotong Keyboard (`ProofOfDeliveryModal.tsx`).
- Masalah D: Tautan Navigasi Ganda yang Berdesakan di `/distribusi/page.tsx`.

## Global Constraints

- Tetap menjaga 100% fungsionalitas aksi desktop yang sudah ada (tidak ada tombol aksi yang hilang saat berpindah ke mobile).
- Menjaga 200 tes eksisting di Vitest tetap PASS.
- Desain konsisten dengan tema Vertix/SisaBerkah (Emerald/Slate Tailwind tokens).
- Mendukung lebar layar minimal 360px tanpa horizontal scrollbar di level body halaman.

## Review Focus

1. **Aksi Lengkap di Card Stack:** Di `/makanan/kelola`, seluruh 4 aksi ([Cetak Label], [Edit Info], [Koreksi], [Buang]) harus dapat ditekan dengan mudah pada kartu mobile tanpa bertumpuk atau terpotong.
2. **Kesesuaian Tampilan Desktop vs Mobile:** Pada layar $\ge 768$px, tabel desktop harus tetap tampil seperti semula (`hidden md:table` / `hidden md:block`), dan kartu mobile harus tersembunyi (`block md:hidden`).
3. **Scrollability Modal saat Keyboard Aktif:** Pada modal BAST serah terima, saat input nama difokuskan, konten foto dan kanvas tanda tangan dapat di-scroll vertikal, dan tombol aksi konfirmasi tetap dapat dijangkau relawan.
4. **Ketepatan Tautan Navigasi Tunggal:** Tombol navigasi tunggal di kartu distribusi harus mengarah ke URL direktori rute Google Maps resmi (`https://www.google.com/maps/dir/?api=1&destination=...`).
5. **Layout Header pada 360px:** Header tidak boleh mengalami layout break atau text wrapping yang menabrak ikon lonceng notifikasi pada viewport sempit.

---

### Task 1: Mobile Card Stack untuk Kelola Stok Pangan (`/makanan/kelola`)

**Files:**
- Modify: `src/app/(dashboard)/makanan/kelola/page.tsx`
- Create: `tests/mobile-inventory-cards.test.ts`

**Interfaces:**
- Produces: Komponen kartu mobile untuk setiap item stok di `/makanan/kelola/page.tsx` dengan trigger modal yang sama (`setShelfLabelItem`, `openEditMeta`, `setCorrectItem`, `setDisposeItem`).
- Tampilan: `hidden md:table` untuk tabel desktop, `block md:hidden` untuk kartu tumpuk mobile.

- [ ] **Step 1: Write UI tests verifying mobile card stack rendering and action buttons**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `src/app/(dashboard)/makanan/kelola/page.tsx` with mobile card stack**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Verify visually with code inspection**

---

### Task 2: Mobile Card Stack untuk Donatur, Penerima, dan Pengguna

**Files:**
- Modify: `src/app/(dashboard)/donatur/page.tsx`
- Modify: `src/app/(dashboard)/penerima/page.tsx`
- Modify: `src/app/(dashboard)/pengguna/page.tsx`
- Create: `tests/mobile-directory-cards.test.ts`

**Interfaces:**
- `/donatur`: Mobile card stack menampilkan nama donatur, kategori badge, kontak telepon/WhatsApp, alamat operasional, tombol Edit & Hapus.
- `/penerima`: Mobile card stack menampilkan nama penerima, kuota porsi, kategori badge, kontak, alamat, tombol Edit & Hapus (jika Admin).
- `/pengguna`: Mobile card stack menampilkan nama, email, badge peran (ADMIN/RELAWAN), status akun aktif/nonaktif, dan tombol toggle status.

- [ ] **Step 1: Write UI tests verifying mobile cards for Donatur, Penerima, and Pengguna**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `/donatur/page.tsx` with mobile card stack**
- [ ] **Step 4: Update `/penerima/page.tsx` with mobile card stack**
- [ ] **Step 5: Update `/pengguna/page.tsx` with mobile card stack**
- [ ] **Step 6: Run tests and verify PASS**

---

### Task 3: Header Anti-Overflow untuk Layar 360px (`top-header.tsx`)

**Files:**
- Modify: `src/components/layout/top-header.tsx`
- Modify: `tests/top-header.test.ts`

**Interfaces:**
- Modifies: User profile chip pada mobile `< sm` menyembunyikan blok teks nama dan peran (`hidden sm:flex flex-col`), menyisakan avatar kompak dengan atribut title/aria-label yang lengkap.
- Modifies: Dropdown panel lonceng notifikasi menggunakan `w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm right-0` untuk menghindari overflow di layar $\le 360$px.
- Modifies: Padding container header disesuaikan menjadi `px-2.5 sm:px-4` dengan `gap-2 sm:gap-3`.

- [ ] **Step 1: Update `tests/top-header.test.ts` with mobile layout assertions**
- [ ] **Step 2: Run test to verify expected behavior**
- [ ] **Step 3: Update `src/components/layout/top-header.tsx`**
- [ ] **Step 4: Run tests and verify PASS**

---

### Task 4: Modal BAST Tanda Tangan Anti-Terpotong Keyboard Virtual

**Files:**
- Modify: `src/components/ProofOfDeliveryModal.tsx`
- Modify: `tests/proof-of-delivery.test.ts`

**Interfaces:**
- Modifies: `ProofOfDeliveryModal` card menggunakan `max-h-[85vh] flex flex-col`.
- Modifies: Konten body modal menggunakan `flex-1 overflow-y-auto` sehingga scrollable saat keyboard virtual terbuka di layar HP.
- Modifies: Footer tombol aksi (`Batal` dan `Simpan & Konfirmasi Diterima`) berada di posisi yang selalu dapat diakses relawan (`sticky bottom-0` atau dalam flex container).

- [ ] **Step 1: Update `tests/proof-of-delivery.test.ts` with max-height and scroll container checks**
- [ ] **Step 2: Run test to verify failure/pass status**
- [ ] **Step 3: Update `src/components/ProofOfDeliveryModal.tsx`**
- [ ] **Step 4: Run tests and verify PASS**

---

### Task 5: Konsolidasi Tautan Navigasi Ganda di Kartu Distribusi

**Files:**
- Modify: `src/app/(dashboard)/distribusi/page.tsx`
- Modify: `tests/contact-navigation.test.ts`

**Interfaces:**
- Modifies: Kartu distribusi di `/distribusi/page.tsx` menggantikan dua tautan berdampingan ("📍 Buka di Google Maps" dan "🧭 Rute Navigasi") menjadi 1 tombol navigasi terintegrasi: "🧭 Rute Navigasi" menggunakan `getGoogleNavigationUrl(dist.beneficiary.address)`.

- [ ] **Step 1: Update `tests/contact-navigation.test.ts` to assert single navigation button**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `src/app/(dashboard)/distribusi/page.tsx`**
- [ ] **Step 4: Run tests and verify PASS**

---

### Task 6: Verifikasi Menyeluruh & Build Check

- [ ] **Step 1: Run full Vitest test suite (`cmd /c npx vitest run`)**
- [ ] **Step 2: Run Next.js build verification (`cmd /c npm run build`)**
- [ ] **Step 3: Final confirmation**
