# Implementasi Perbaikan Header, Alarm Kritis, Profil, dan Dialog Konfirmasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki 4 masalah UX dan interaktivitas: tombol pencarian global dead-end (⌘K), query param `foodStockId` terabaikan pada alarm kritis, chip profil pasif, serta dialog konfirmasi bawaan browser (`confirm`/`alert`).

**Architecture:** 
1. Komponen `CommandPaletteModal` dengan keyboard event listener (`Ctrl+K`/`⌘K`) untuk navigasi dan aksi cepat.
2. Integrasi `useSearchParams` pada `CreateDistributionPage` dengan wrapper `Suspense` untuk menangkap `foodStockId` dari alarm kritis.
3. Dropdown profil interaktif di `TopHeader` dengan ringkasan pengguna, menu navigasi, modal ganti kata sandi, dan aksi logout.
4. Komponen reusable `ConfirmModal` dan migrasi semua pemanggilan `window.confirm` dan `window.alert` di halaman distribusi, donatur, penerima, dan pengguna.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Lucide React, Framer Motion, Vitest.

**Spec:** Permintaan pengguna mengenai 4 masalah teknis UI/UX di `src/components/layout/top-header.tsx`, `src/app/(dashboard)/distribusi/buat/page.tsx`, dan halaman manajemen data.

## Global Constraints
- Tetap mematuhi aturan otentikasi role (`ADMIN` vs `RELAWAN`).
- Desain konsisten dengan tema Dark & Light mode aplikasi Sisa Berkah.
- Komponen Next.js App Router yang memakai `useSearchParams` wajib dibungkus `<Suspense>` agar tidak memicu build / prerender de-optimization.
- Tidak boleh ada lagi pemanggilan `window.confirm(...)` atau `window.alert(...)` di aplikasi.

## Review Focus
1. Tekan `Ctrl+K` atau `Cmd+K` di halaman mana saja memunculkan modal pencarian, dan tombol Esc menutupnya.
2. Klik tombol "Distribusikan Segera" pada batch di dropdown alarm lonceng membuka `/distribusi/buat?foodStockId=<id>` dan batch tersebut langsung terpilih otomatis di baris item pertama.
3. Chip profil di header membuka dropdown menu profil dengan info pengguna, tombol Ganti Kata Sandi, dan Logout.
4. Modal Ganti Kata Sandi memvalidasi kecocokan sandi lama & aturan sandi baru serta mengembalikan respon yang jelas.
5. Tombol hapus donatur, hapus penerima manfaat, dan ubah status distribusi menggunakan `ConfirmModal` elegan, bukan pop-up bawaan browser.

---

### Task 1: Komponen Global Search / Command Palette (`⌘K` / `Ctrl+K`)
**Files:**
- Create: `src/components/layout/command-palette-modal.tsx`
- Modify: `src/components/layout/top-header.tsx`
- Test: `tests/command-palette.test.ts`

**Interfaces:**
- Consumes: `currentUser: { name: string; role: string } | null`
- Produces: `<CommandPaletteModal isOpen={boolean} onClose={() => void} currentUser={...} />`

- [x] **Step 1: Buat unit test untuk CommandPaletteModal**
- [x] **Step 2: Jalankan test untuk memverifikasi kegagalan (file belum dibuat)**
- [x] **Step 3: Implementasikan `src/components/layout/command-palette-modal.tsx`**
- [x] **Step 4: Sambungkan di `src/components/layout/top-header.tsx`**
- [x] **Step 5: Jalankan test untuk memastikan sukses**

---

### Task 2: Pembacaan Query Parameter `foodStockId` pada Pembuatan Distribusi
**Files:**
- Modify: `src/app/(dashboard)/distribusi/buat/page.tsx`
- Test: `tests/distribution-stock-param.test.ts`

**Interfaces:**
- Consumes: Next.js `useSearchParams()` -> `foodStockId`
- Produces: Pre-selected stock item di baris pertama distribusi sesuai ID yang diberikan.

- [x] **Step 1: Buat test verifikasi logika inisialisasi stok dengan parameter `foodStockId`**
- [x] **Step 2: Jalankan test untuk memastikan kegagalan jika `foodStockId` diabaikan**
- [x] **Step 3: Perbarui `src/app/(dashboard)/distribusi/buat/page.tsx`**
- [x] **Step 4: Jalankan test untuk memastikan sukses**

---

### Task 3: Menu Dropdown Profil Interaktif dan Modal Ganti Kata Sandi
**Files:**
- Create: `src/components/ChangePasswordModal.tsx`
- Create: `src/app/api/auth/change-password/route.ts`
- Modify: `src/components/layout/top-header.tsx`
- Modify: `src/services/auth.service.ts`
- Test: `tests/change-password.test.ts`

**Interfaces:**
- Produces: API endpoint `POST /api/auth/change-password` `{ currentPassword, newPassword }`
- Produces: Interactive Dropdown di `TopHeader` dengan opsi Profil, Kelola Akun (Admin), Ganti Sandi, dan Logout.

- [x] **Step 1: Buat test untuk API `POST /api/auth/change-password` dan service `authService.changePassword`**
- [x] **Step 2: Jalankan test untuk memverifikasi fail**
- [x] **Step 3: Implementasikan `changePassword` di `src/services/auth.service.ts` dan route di `src/app/api/auth/change-password/route.ts`**
- [x] **Step 4: Buat komponen `src/components/ChangePasswordModal.tsx`**
- [x] **Step 5: Perbarui chip profil di `src/components/layout/top-header.tsx` menjadi dropdown interaktif**
- [x] **Step 6: Jalankan test untuk memastikan sukses**

---

### Task 4: Komponen Reusable `ConfirmModal` dan Penghapusan `confirm()` & `alert()`
**Files:**
- Create: `src/components/ConfirmModal.tsx`
- Modify: `src/app/(dashboard)/distribusi/page.tsx`
- Modify: `src/app/(dashboard)/donatur/page.tsx`
- Modify: `src/app/(dashboard)/penerima/page.tsx`
- Modify: `src/app/(dashboard)/pengguna/page.tsx`
- Test: `tests/confirm-modal.test.ts`

**Interfaces:**
- Produces: `<ConfirmModal isOpen={...} title={...} message={...} onConfirm={...} onClose={...} />`

- [x] **Step 1: Buat unit test untuk ConfirmModal**
- [x] **Step 2: Jalankan test untuk memverifikasi fail**
- [x] **Step 3: Implementasikan `src/components/ConfirmModal.tsx`**
- [x] **Step 4: Migrasikan `src/app/(dashboard)/distribusi/page.tsx`**
- [x] **Step 5: Migrasikan `src/app/(dashboard)/donatur/page.tsx`**
- [x] **Step 6: Migrasikan `src/app/(dashboard)/penerima/page.tsx`**
- [x] **Step 7: Migrasikan `src/app/(dashboard)/pengguna/page.tsx`**
- [x] **Step 8: Jalankan seluruh test suite untuk memastikan semua lulus**
