# Relawan & Logistik Lapangan Implementation Plan (POV Relawan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun 9 fitur operasional logistik lapangan & gudang untuk relawan SisaBerkah: (1) Penugasan kurir di form distribusi, (2) Backend filter & UI "Tugas Saya", (3) Tombol kontak langsung (Telepon & WhatsApp), (4) Navigasi Google Maps turn-by-turn langsung, (5) Bukti serah terima (Proof of Delivery / BAST) foto & tanda tangan digital, (6) Batch Inbound input banyak makanan sekaligus, (7) Integrasi preset kedaluwarsa multi-baris, (8) Cetak label rak / QR code fisik gudang, dan (9) Dukungan PWA & antrean offline.

**Architecture:**
1. **Distribusi & Penugasan Kurir:** Endpoint `GET /api/users/volunteers` menyediakan daftar relawan aktif untuk dropdown form `/distribusi/buat`. `Distribution.assignedToUserId` dihubungkan ke form, dan `GET /api/distributions` mendukung query `assignedToUserId` untuk filtering server-side.
2. **Kontak & Navigasi Cepat:** Kartu distribusi di `/distribusi` dilengkapi tombol panggilan `tel:`, WhatsApp langsung `https://wa.me/62...`, dan navigasi rute Google Maps `https://www.google.com/maps/dir/?api=1&destination=...`.
3. **BAST & Proof of Delivery:** Skema `Distribution` diperluas dengan `recipientName`, `proofPhoto`, `signatureData`, dan `deliveredAt`. Modal konfirmasi "DITERIMA" menyediakan canvas tanda tangan digital dan file input foto serah terima.
4. **Batch Inbound & Presets:** Service `foodService.createBatchInbound` memproses banyak makanan sekaligus dari 1 donatur dalam satu transaksi database Prisma, dengan tombol preset kedaluwarsa (+4 Jam, +12 Jam, Besok Pagi) di setiap baris.
5. **Cetak Label Rak / QR Code:** Komponen stiker label rak di `/makanan/kelola` merender stiker ber-QR code/barcode ID, nama makanan, donatur, tanggal kedaluwarsa, dan instruksi penanganan pangan, siap cetak via `@media print`.
6. **PWA & Offline Queue:** Web App Manifest `public/manifest.json`, Service Worker `public/sw.js`, utilitas sinkronisasi `src/lib/offline-storage.ts`, serta banner status koneksi online/offline di UI.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma ORM, SQLite, Vitest, Tailwind CSS, Lucide React, HTML5 Canvas API.

**Spec:** POV Relawan (Logistik Lapangan & Petugas Gudang) Gap Checklist:
1. Filter "Tugas / Pengantaran Saya": filter jadwal khusus relawan pengantar.
2. Pemilihan Kurir di Form Distribusi: dropdown `assignedToUserId` di `/distribusi/buat`.
3. Bukti Foto Serah Terima (Proof of Delivery / BAST): upload foto & tanda tangan digital di HP.
4. Integrasi Navigasi Langsung (Google Maps): rute Google Maps sekali klik.
5. Tombol Kontak Langsung (Call / WhatsApp): tombol `tel:` dan `wa.me/` langsung ke penerima.
6. Input Banyak Makanan Sekaligus (Batch Inbound): form multi-item dari 1 donatur katering.
7. Tombol Cepat Durasi Kedaluwarsa: preset jam terintegrasi di form batch.
8. Cetak Label Rak / QR Code Fisik: stiker barcode/QR code wadah gudang.
9. Mode Kerja Offline (PWA): manifest, service worker caching, dan penyimpanan offline lokal.

## Global Constraints

- Kompatibel dengan skema Prisma dan database SQLite (`prisma/dev.db`).
- Menjaga integritas FEFO dan aturan keselamatan pangan (makanan ditolak/kedaluwarsa tidak boleh disalurkan).
- Menjaga otentikasi sesi `sb_session` dan RBAC yang sudah ada.
- Seluruh 159 tes eksisting harus tetap 100% lolos (PASS), ditambah tes baru untuk setiap fitur baru.
- Foto dan tanda tangan disimpan efisien (format string base64 / data URL) tanpa ketergantungan library eksternal berbayar.

## Review Focus

1. **Format Nomor WhatsApp:** Nomor telepon donatur/penerima di Indonesia (misal `0812...` atau `+62812...`) harus dinormalisasi dengan benar ke format internasional tanpa tanda plus (`62812...`) untuk tautan `https://wa.me/`.
2. **Validasi Atomik Batch Inbound:** Jika salah satu item dalam batch makanan gagal validasi (misal jumlah $\le 0$ atau tanggal kedaluwarsa lampau), seluruh batch harus ditolak atau ditangani secara konsisten tanpa menyisakan data yatim.
3. **Penyimpanan Bukti Serah Terima:** Bukti foto dan tanda tangan harus tervalidasi saat status diubah ke `DITERIMA` tanpa merusak transisi status lainnya (`DIKIRIM` atau `DIBATALKAN`).
4. **Resiliensi Pengguna Relawan Non-Admin:** Endpoint pemilihan relawan kurir harus dapat diakses oleh semua pengguna terautentikasi (bukan hanya `ADMIN`) tanpa membocorkan `passwordHash` atau token sensitif.
5. **Layout Cetak Label Rak Fisik:** Halaman/modal cetak stiker rak harus menyembunyikan sidebar, navbar, dan kontrol cetak saat `@media print` aktif sehingga hanya label stiker yang tercetak di kertas/label printer.

---

### Task 1: Endpoint Relawan Kurir & Penugasan di Form Distribusi

**Files:**
- Create: `src/app/api/users/volunteers/route.ts`
- Modify: `src/app/(dashboard)/distribusi/buat/page.tsx`
- Modify: `src/app/api/distributions/route.ts`
- Modify: `src/services/distribution.service.ts`
- Create: `tests/volunteer-courier.test.ts`

**Interfaces:**
- Produces: `GET /api/users/volunteers` -> `[{ id: string, name: string, email: string }]`
- Modifies: `POST /api/distributions` menerima `assignedToUserId?: string`
- Modifies: `GET /api/distributions?assignedToUserId=...` memfilter jadwal berdasarkan kurir

- [ ] **Step 1: Write test for volunteers endpoint & distribution filter**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `GET /api/users/volunteers/route.ts`**
- [ ] **Step 4: Update `distributionService.list` to support `assignedToUserId` filtering**
- [ ] **Step 5: Update `/distribusi/buat/page.tsx` with Courier Picker dropdown**
- [ ] **Step 6: Run tests and verify PASS**
- [ ] **Step 7: Commit**

---

### Task 2: Tombol Kontak Langsung (Call & WhatsApp) & Rute Navigasi Google Maps

**Files:**
- Modify: `src/lib/quick-wins-utils.ts`
- Modify: `src/app/(dashboard)/distribusi/page.tsx`
- Create: `tests/contact-navigation.test.ts`

**Interfaces:**
- Produces: `getWhatsAppUrl(phone: string, message?: string): string`
- Produces: `getGoogleNavigationUrl(address: string): string`
- Modifies: Kartu distribusi di `/distribusi/page.tsx` menampilkan tombol Telepon, WhatsApp, dan Navigasi Peta langsung.

- [ ] **Step 1: Write unit tests for WhatsApp number formatting and navigation URLs**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement helpers in `src/lib/quick-wins-utils.ts`**
- [ ] **Step 4: Integrate Call, WhatsApp, and Navigation buttons in `src/app/(dashboard)/distribusi/page.tsx`**
- [ ] **Step 5: Run tests and verify PASS**
- [ ] **Step 6: Commit**

---

### Task 3: Bukti Foto Serah Terima (Proof of Delivery / BAST) & Tanda Tangan Digital

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/services/distribution.service.ts`
- Modify: `src/app/api/distributions/[id]/status/route.ts`
- Create: `src/components/ProofOfDeliveryModal.tsx`
- Modify: `src/app/(dashboard)/distribusi/page.tsx`
- Create: `tests/proof-of-delivery.test.ts`

**Interfaces:**
- Prisma: `Distribution` menambahkan `recipientName String?`, `proofPhoto String?`, `signatureData String?`, `deliveredAt DateTime?`
- Service: `distributionService.updateStatus(id, 'DITERIMA', userId, { recipientName, proofPhoto, signatureData })`
- UI: Modal BAST dengan canvas tanda tangan dan upload/kamera foto serah terima.

- [ ] **Step 1: Write test for Proof of Delivery service logic**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `prisma/schema.prisma` and run `npx prisma db push`**
- [ ] **Step 4: Update `distributionService.updateStatus` & status route handler**
- [ ] **Step 5: Create `ProofOfDeliveryModal` component with Signature Canvas & Photo Upload**
- [ ] **Step 6: Integrate modal into `src/app/(dashboard)/distribusi/page.tsx` and show proof badge/button**
- [ ] **Step 7: Run tests and verify PASS**
- [ ] **Step 8: Commit**

---

### Task 4: Input Banyak Makanan Sekaligus (Batch Inbound) & Tombol Preset Durasi

**Files:**
- Modify: `src/services/food.service.ts`
- Create: `src/app/api/food/inbound/batch/route.ts`
- Modify: `src/app/(dashboard)/makanan/masuk/page.tsx`
- Create: `tests/batch-inbound.test.ts`

**Interfaces:**
- Produces: `foodService.createBatchInbound(donorId, items, userId)`
- Produces: `POST /api/food/inbound/batch`
- Modifies: `/makanan/masuk/page.tsx` dengan mode multi-baris dinamis dan tombol cepat durasi per item.

- [ ] **Step 1: Write tests for `foodService.createBatchInbound` and API route**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `createBatchInbound` in `src/services/food.service.ts`**
- [ ] **Step 4: Create route handler `src/app/api/food/inbound/batch/route.ts`**
- [ ] **Step 5: Update `/makanan/masuk/page.tsx` with dynamic multi-row entry & presets**
- [ ] **Step 6: Run tests and verify PASS**
- [ ] **Step 7: Commit**

---

### Task 5: Cetak Label Rak / QR Code Fisik Wadah Gudang

**Files:**
- Create: `src/components/ShelfLabelModal.tsx`
- Modify: `src/app/(dashboard)/makanan/kelola/page.tsx`
- Create: `tests/shelf-label.test.ts`

**Interfaces:**
- Produces: `ShelfLabelModal` dengan QR Code SVG render, format stiker 7x5 cm / 80mm thermal, info FEFO, dan tombol Cetak via `window.print()`
- Modifies: `/makanan/kelola/page.tsx` menambahkan tombol "Label Rak" pada setiap baris stok makanan

- [ ] **Step 1: Write test for shelf label generator and QR data rendering**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `ShelfLabelModal.tsx` with barcode/QR code SVG layout and print styles**
- [ ] **Step 4: Connect modal to `/makanan/kelola/page.tsx`**
- [ ] **Step 5: Run tests and verify PASS**
- [ ] **Step 6: Commit**

---

### Task 6: Mode Kerja Offline (PWA) & Indikator Sinyal

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `src/lib/offline-storage.ts`
- Create: `src/components/OfflineIndicator.tsx`
- Modify: `src/app/layout.tsx`
- Create: `tests/pwa-offline.test.ts`

**Interfaces:**
- Produces: `manifest.json` untuk instalasi PWA di perangkat HP relawan
- Produces: `sw.js` untuk cache halaman offline dan aset
- Produces: `offlineStorage` helper untuk mencatat antrean aksi offline
- Produces: `OfflineIndicator` bar status online/offline di layout

- [ ] **Step 1: Write tests for offline storage helper and PWA manifest presence**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Create `public/manifest.json` and `public/sw.js`**
- [ ] **Step 4: Implement `src/lib/offline-storage.ts` and `OfflineIndicator.tsx`**
- [ ] **Step 5: Register service worker in `src/app/layout.tsx`**
- [ ] **Step 6: Run tests and verify PASS**
- [ ] **Step 7: Commit**

---

### Task 7: Verifikasi Menyeluruh & Integrasi Akhir (Full Test Suite)

- [ ] **Step 1: Run full Vitest test suite (`cmd /c npx vitest run`)**
- [ ] **Step 2: Run Next.js build check (`cmd /c npm run build`)**
- [ ] **Step 3: Final commit**
