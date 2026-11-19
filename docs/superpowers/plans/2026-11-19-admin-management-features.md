# Admin & Koordinator Food Bank Management Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun 5 fitur proteksi dan manajerial kritis untuk Admin & Koordinator SisaBerkah: (1) Koreksi metadata makanan masuk, (2) Validasi kapasitas kuota penerima manfaat, (3) Filter rentang tanggal & ekspor PDF resmi laporan bertanda tangan CSR, (4) Diff Viewer visual "Sebelum vs Sesudah" pada jejak audit, dan (5) Sistem alarm lonceng notifikasi kritis untuk pangan $\le 2$ jam kedaluwarsa.

**Architecture:**
1. **Metadata Editing:** Service `foodService.updateMetadata` memungkinkan Admin mengoreksi nama makanan, donatur asal, tanggal kedaluwarsa, dan catatan stok, dengan pencatatan audit log mutasi mendalam. UI menyediakan modal koreksi data di `/makanan/kelola`.
2. **Kapasitas Kuota Penerima:** Field `capacity Int?` ditambahkan ke model `Beneficiary`. Service `distributionService.createSchedule` memvalidasi total porsi alokasi terhadap kapasitas penerima, mengembalikan peringatan/blokir jika kuota terlampaui kecuali diberikan konfirmasi *bypass* darurat. Form `/distribusi/buat` menampilkan indikator kuota interaktif.
3. **Filter Tanggal & Dokumen Cetak/PDF Resmi:** `reportService` dan `auditService` mendukung parameter `startDate` dan `endDate`. Halaman `/laporan` dilengkapi Date Range Filter dan tombol ekspor yang merender dokumen laporan resmi ber-kop surat SisaBerkah, tabel ringkasan per satuan terpisah, serta blok tanda tangan ganda resmi (Koordinator Food Bank & Sponsor/CSR Mitra) via layout cetak `@media print` / window.print.
4. **Visual Audit Diff Viewer:** Komponen pembanding JSON mutasi yang mengekstrak data perubahan (`previousRemaining` vs `newRemaining`, `disposedQuantity`, `previousInitial` vs `newInitial`, dsb) dan menyajikannya dalam kartu visual "Sebelum vs Sesudah" dengan indikator warna status alih-alih teks JSON mentah.
5. **Alarm Notifikasi Kritis ($\le 2$ jam):** Endpoint `/api/notifications/critical` menghitung batch makanan aktif yang akan basi dalam kurun waktu $\le 2$ jam dan belum memiliki jadwal distribusi. Komponen `TopHeader` menampilkan lonceng aktif ber-badge merah/animasi pulsa beserta dropdown interaktif untuk tindakan cepat, didukung banner peringatan di `/dashboard`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Prisma ORM, SQLite, Vitest, Tailwind CSS, Lucide React.

**Spec:** POV Admin & Koordinator Food Bank (Manajemen) Gap Checklist:
- Edit Metadata Makanan Masuk (salah ketik nama, salah donatur, salah tanggal expired).
- Validasi Kapasitas Penerima Manfaat (mencegah salah alokasi ratusan porsi ke panti kecil).
- Filter Tanggal & Ekspor PDF Resmi Laporan (Date range filter & lembar laporan resmi bertanda tangan sponsor).
- Tampilan Perubahan Audit (Diff Viewer "Sebelum vs Sesudah").
- Sistem Notifikasi / Alarm Kritis (Lonceng & popup batch makanan $\le 2$ jam kedaluwarsa belum terjadwal).

## Global Constraints

- Wajib mempertahankan keamanan sesi `sb_session` dan role-based access control (Admin vs Relawan).
- Operasi pengeditan metadata makanan masuk hanya boleh dilakukan oleh role `ADMIN`.
- Unit pangan tetap tersegregasi secara mutlak (tidak boleh menjumlahkan unit silang antara "porsi", "kg", "kotak").
- Kompatibel dengan database SQLite yang ada melalui migrasi/push Prisma.
- Seluruh 159 tes yang ada harus tetap 100% lolos (PASS), ditambah tes baru untuk setiap fitur manajerial ini.

## Review Focus

1. **Role Access Control pada Edit Metadata:** Relawan biasa yang mencoba mengedit metadata melalui API harus ditolak dengan status HTTP 403 Forbidden.
2. **Kapasitas Penerima Manfaat Zero / Null:** Penerima manfaat yang belum memiliki kapasitas tercatat (null/0) tidak boleh diblokir sepihak saat distribusi dibuat; validasi hanya aktif jika kapasitas ditentukan, dengan opsi bypass darurat jika kuota melebihi.
3. **Edge Cases Filter Tanggal Laporan:** Filter tanggal mulai (startDate) setelah tanggal selesai (endDate) harus ditangani anggun tanpa menyebabkan server 500 error; rentang tanggal kosong memuat data keseluruhan.
4. **Resilient JSON Diff Parsing:** Jejak audit lama atau audit dengan payload string non-objek tidak boleh membuat Diff Viewer crash (fallback anggun ke tampilan terformat).
5. **Akurasi Alarm Kedaluwarsa $\le 2$ Jam:** Batch makanan yang sudah berstatus dibuang (`isDisposed = true`), kuantitas tersisa 0 (`remainingQuantity = 0`), atau sudah selesai terjadwal/dikirim tidak boleh memicu alarm lonceng.

---

### Task 1: Food Inbound Metadata Editing (Service, API, & UI)

**Files:**
- Modify: `src/services/food.service.ts`
- Create: `src/app/api/food/[id]/metadata/route.ts`
- Modify: `src/app/(dashboard)/makanan/kelola/page.tsx`
- Create: `tests/food-metadata-edit.test.ts`

**Interfaces:**
- Produces: `foodService.updateMetadata(stockId: string, input: { name?: string; donorId?: string; expiryAt?: Date | string; notes?: string }, userId: string, userRole: string)`
- Produces: `PATCH /api/food/[id]/metadata` -> `{ success: true, food: FoodStock }`

- [ ] **Step 1: Write the failing test for `foodService.updateMetadata` and API endpoint**

Buat `tests/food-metadata-edit.test.ts` yang menguji:
- Admin dapat mengoreksi nama makanan, donatur, tanggal kedaluwarsa, dan catatan.
- Relawan ditolak dengan pesan otorisasi (403/Forbidden).
- Donatur baru yang tidak valid ditolak.
- Tercatat audit log dengan action `STOCK_METADATA_UPDATE` yang menyimpan rincian sebelum vs sesudah.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/food-metadata-edit.test.ts`
Expected: FAIL (`updateMetadata is not a function`).

- [ ] **Step 3: Implement `updateMetadata` in `src/services/food.service.ts`**

Tambahkan method `updateMetadata` dengan pengecekan role `ADMIN`, validasi eksistensi stok dan donatur, update field yang diizinkan, dan pencatatan audit log `STOCK_METADATA_UPDATE`.

- [ ] **Step 4: Create route handler `src/app/api/food/[id]/metadata/route.ts`**

Membaca `getSessionUser(req)`, memvalidasi role `ADMIN`, menerima body JSON `{ name, donorId, expiryAt, notes }`, dan memanggil `foodService.updateMetadata`.

- [ ] **Step 5: Run tests to verify backend passes**

Run: `cmd /c npx vitest run tests/food-metadata-edit.test.ts`
Expected: PASS.

- [ ] **Step 6: Add Edit Metadata Modal to `src/app/(dashboard)/makanan/kelola/page.tsx`**

Tambahkan tombol "Edit Info" di tabel stok makanan, membuka modal dengan input: Nama Makanan, Pilihan Donatur (dropdown), Tanggal Kedaluwarsa (datetime-local), dan Catatan. Saat disimpan, panggil `PATCH /api/food/${item.id}/metadata` dan perbarui daftar stok.

- [ ] **Step 7: Commit**

Commit task 1 perubahan edit metadata.

---

### Task 2: Beneficiary Capacity & Distribution Quota Validation

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/services/beneficiary.service.ts`
- Modify: `src/services/distribution.service.ts`
- Modify: `src/app/api/beneficiaries/route.ts`
- Modify: `src/app/(dashboard)/penerima/page.tsx`
- Modify: `src/app/(dashboard)/distribusi/buat/page.tsx`
- Create: `tests/beneficiary-capacity.test.ts`

**Interfaces:**
- `Beneficiary.capacity`: `Int?` (kuota/kapasitas porsi/jiwa)
- `CreateDistributionInput.forceBypassCapacity`: `boolean?`
- `distributionService.createSchedule`: validasi kapasitas penerima jika ditentukan

- [ ] **Step 1: Write the failing test for beneficiary capacity and distribution quota**

Buat `tests/beneficiary-capacity.test.ts`:
- Membuat penerima manfaat dengan `capacity: 30`.
- Menjadwalkan distribusi 100 porsi ke penerima tersebut tanpa bypass -> ditolak dengan error kuota terlampaui.
- Menjadwalkan distribusi 100 porsi dengan `forceBypassCapacity: true` -> berhasil dengan catatan audit log bypass kuota.
- Alokasi yang tidak melebihi kapasitas (misal 25 porsi) -> berhasil langsung.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/beneficiary-capacity.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update Prisma schema and push database**

Tambahkan `capacity Int?` pada model `Beneficiary` di `prisma/schema.prisma`.
Jalankan: `cmd /c npx prisma db push`.

- [ ] **Step 4: Update `beneficiary.service.ts` and API**

Dukung field `capacity?: number | null` pada `CreateBeneficiaryInput`, `update`, dan route handler `/api/beneficiaries`.

- [ ] **Step 5: Implement quota validation in `src/services/distribution.service.ts`**

Dalam `createSchedule`, hitung total kuantitas porsi yang dialokasikan. Ambil data penerima manfaat. Jika penerima memiliki `capacity > 0` dan total kuantitas melebihi kapasitas tanpa `forceBypassCapacity`, lempar error deskriptif. Jika `forceBypassCapacity = true`, izinkan dan sertakan `capacityBypassed: true` dalam audit log.

- [ ] **Step 6: Run tests to verify backend passes**

Run: `cmd /c npx vitest run tests/beneficiary-capacity.test.ts`
Expected: PASS.

- [ ] **Step 7: Update UI in `/penerima` and `/distribusi/buat`**

- Di `/penerima`: tambahkan input "Kapasitas Penerima (Porsi/Jiwa)" pada form tambah/edit penerima dan kolom "Kapasitas" di tabel.
- Di `/distribusi/buat`: tampilkan kuota kapasitas di samping nama penerima terpilih. Jika total alokasi > kapasitas, tampilkan kotak peringatan kuning dengan checkbox konfirmasi "Izinkan alokasi melebihi kapasitas untuk kebutuhan darurat (Bypass)".

- [ ] **Step 8: Commit**

Commit task 2 validasi kapasitas penerima manfaat.

---

### Task 3: Date Range Filter for Reports & Audit Logs

**Files:**
- Modify: `src/services/report.service.ts`
- Modify: `src/services/audit.service.ts`
- Modify: `src/app/api/reports/rescued/route.ts`
- Modify: `src/app/api/reports/donors/route.ts`
- Modify: `src/app/api/audit/route.ts`
- Modify: `src/app/(dashboard)/laporan/page.tsx`
- Create: `tests/report-date-filter.test.ts`

**Interfaces:**
- `reportService.getRescuedFoodReport(dateRange?: { startDate?: Date; endDate?: Date })`
- `reportService.getDonorTransparencyReport(dateRange?: { startDate?: Date; endDate?: Date })`
- `auditService.getLogs(params?: { startDate?: Date; endDate?: Date; ... })`
- API query params: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

- [ ] **Step 1: Write failing test for date range filtering**

Buat `tests/report-date-filter.test.ts`:
- Uji filter rentang tanggal pada `reportService.getRescuedFoodReport`.
- Uji filter rentang tanggal pada `reportService.getDonorTransparencyReport`.
- Uji filter rentang tanggal pada `auditService.getLogs`.
- Pastikan transaksi di luar rentang tanggal tidak ikut terhitung.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/report-date-filter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement date range filter in services and API route handlers**

Perbarui query Prisma di `report.service.ts` dan `audit.service.ts` agar menerima opsi `startDate` dan `endDate`, serta perbarui route handler untuk mengekstrak parameter URL `startDate` dan `endDate`.

- [ ] **Step 4: Run tests to verify backend passes**

Run: `cmd /c npx vitest run tests/report-date-filter.test.ts`
Expected: PASS.

- [ ] **Step 5: Integrate Date Range Picker bar in `src/app/(dashboard)/laporan/page.tsx`**

Tambahkan komponen Date Range Filter di atas tab laporan (input tanggal mulai & tanggal selesai, tombol filter, tombol reset). Saat rentang tanggal berubah, muat ulang data metrik, donatur, dan audit dengan query param yang sesuai.

- [ ] **Step 6: Commit**

Commit task 3 filter rentang tanggal laporan.

---

### Task 4: Official Printable PDF Report with CSR Dual Signatures

**Files:**
- Create: `src/app/(dashboard)/laporan/cetak/page.tsx`
- Modify: `src/app/(dashboard)/laporan/page.tsx`
- Create: `tests/report-official-print.test.ts`

**Interfaces:**
- Route: `/laporan/cetak?startDate=...&endDate=...`
- Render: Official letterhead, period filter, summary table per unit, donor table, dual signature section (Koordinator Food Bank & Pihak Mitra Sponsor/CSR), and print trigger.

- [ ] **Step 1: Write test for official report print module**

Buat `tests/report-official-print.test.ts` memverifikasi rendering dan kelengkapan elemen penting dokumen resmi:
- Kop surat resmi SisaBerkah & informasi kontak.
- Periode laporan tanggal.
- Blok tanda tangan Koordinator Food Bank dan Sponsor/CSR.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/report-official-print.test.ts`
Expected: FAIL.

- [ ] **Step 3: Build `/laporan/cetak/page.tsx`**

Implementasikan halaman dokumen cetak resmi:
- Styling `@media print` clean tanpa sidebar/dock.
- Header resmi: "SISABERKAH FOOD BANK INDONESIA - LAPORAN RESMI PENYELAMATAN & PENYALURAN PANGAN".
- Metadata nomor dokumen, tanggal terbit, dan periode filter.
- Ringkasan pangan terselamatkan (porsi, kg, kotak).
- Tabel kontribusi donatur.
- Kolom tanda tangan resmi:
  - Pihak 1: Koordinator Operasional Food Bank (Nama, Tanggal, Kolom Tanda Tangan & Cap).
  - Pihak 2: Perwakilan Mitra Donatur / Program CSR (Nama Lembaga, Nama Perwakilan, Kolom Tanda Tangan).
- Tombol aksi "Cetak / Simpan PDF" (`window.print()`) dan "Kembali".

- [ ] **Step 4: Run tests to verify print component passes**

Run: `cmd /c npx vitest run tests/report-official-print.test.ts`
Expected: PASS.

- [ ] **Step 5: Add "Ekspor PDF Resmi" button in `src/app/(dashboard)/laporan/page.tsx`**

Tambahkan tombol di header halaman laporan yang membuka `/laporan/cetak?startDate=...&endDate=...` di tab baru.

- [ ] **Step 6: Commit**

Commit task 4 ekspor PDF resmi laporan.

---

### Task 5: Visual Audit Diff Viewer (Sebelum vs Sesudah)

**Files:**
- Create: `src/components/audit/audit-diff-viewer.tsx`
- Modify: `src/app/(dashboard)/laporan/page.tsx`
- Create: `tests/audit-diff-viewer.test.ts`

**Interfaces:**
- Produces: `AuditDiffViewer({ details: string, action: string })`
- Features: Parsing aman JSON, deteksi perubahan sebelum vs sesudah, visual comparison badges, modal dialog untuk detail penuh.

- [ ] **Step 1: Write failing test for `AuditDiffViewer`**

Buat `tests/audit-diff-viewer.test.ts`:
- Uji parsing payload pembuangan stok (`previousRemaining` vs `newRemaining`, `disposedQuantity`, `reason`).
- Uji parsing payload koreksi stok (`previousInitial` vs `newInitial`).
- Uji fallback anggun untuk string JSON biasa atau string mentah non-JSON tanpa crash.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/audit-diff-viewer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `AuditDiffViewer` in `src/components/audit/audit-diff-viewer.tsx`**

Bangun komponen dengan:
- Ringkasan visual inline: menampilkan tag perubahan utama (misal: "Stok: 50 -> 45 porsi (-5)").
- Tombol "Lihat Diff": membuka dialog interaktif dengan tabel komparasi dua kolom:
  - 🔴 Sebelum (Previous Value)
  - 🟢 Sesudah (New Value)
  - 📋 Detail Tambahan (Alasan, Catatan, dsb).

- [ ] **Step 4: Run tests to verify `AuditDiffViewer` passes**

Run: `cmd /c npx vitest run tests/audit-diff-viewer.test.ts`
Expected: PASS.

- [ ] **Step 5: Integrate `AuditDiffViewer` into `src/app/(dashboard)/laporan/page.tsx`**

Gantikan kolom "Detail" monospace mentah di tab Log Audit Mutasi dengan komponen `AuditDiffViewer`.

- [ ] **Step 6: Commit**

Commit task 5 visual audit diff viewer.

---

### Task 6: Critical Expiry Alarm System ($\le 2$ Jam)

**Files:**
- Create: `src/app/api/notifications/critical/route.ts`
- Modify: `src/components/layout/top-header.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `tests/critical-alarm.test.ts`

**Interfaces:**
- Produces: `GET /api/notifications/critical` -> `{ count: number, criticalStocks: Array<{ id, name, remainingQuantity, unit, expiryAt, minutesLeft, donorName }> }`
- Produces: Interactive Notification Bell dropdown di `TopHeader` dengan badge peringatan merah pulsa dan quick action link.
- Produces: Banner peringatan darurat di `/dashboard` jika terdapat stok kritis yang belum terjadwal.

- [ ] **Step 1: Write failing test for critical expiry alarm API and logic**

Buat `tests/critical-alarm.test.ts`:
- Filter stok dengan `expiryAt` dalam $\le 120$ menit dari sekarang, `remainingQuantity > 0`, `isDisposed = false`.
- Stok yang sudah kedaluwarsa lampau atau masih berjarak $> 2$ jam tidak masuk ke alarm darurat.
- Stok yang sudah teralokasi 100% pada distribusi berstatus `TERJADWAL` tidak memicu alarm ganda.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/critical-alarm.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/app/api/notifications/critical/route.ts`**

Membaca sesi user, memfilter batch makanan aktif dengan sisa stok $> 0$, `isDisposed = false`, dan waktu kedaluwarsa antara waktu sekarang hingga $+2$ jam (120 menit). Mengurangkan reservasi jadwal distribusi aktif, dan mengembalikan daftar batch kritis beserta sisa menitnya.

- [ ] **Step 4: Run test to verify backend passes**

Run: `cmd /c npx vitest run tests/critical-alarm.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement interactive Notification Bell in `src/components/layout/top-header.tsx`**

- Fetch `/api/notifications/critical` secara berkala (polling setiap 60 detik atau on-mount).
- Tampilkan badge angka berwarna merah dengan animasi *pulse ring* jika `count > 0`.
- Klik tombol lonceng membuka dropdown popover:
  - Header: "Alarm Pangan Kritis ($\le 2$ Jam)"
  - Daftar batch kritis dengan countdown sisa waktu (e.g., "Sisa 45 menit"), kuantitas, dan donatur.
  - Tombol aksi langsung "Jadwalkan Distribusi" atau "Buka Manajemen Stok".
  - Empty state elegan: "Semua stok dalam batas waktu aman".

- [ ] **Step 6: Add Critical Alert Banner to `src/app/(dashboard)/dashboard/page.tsx`**

Jika terdapat stok kritis $\le 2$ jam, tampilkan banner peringatan mencolok di bagian atas dashboard dengan tombol aksi cepat ke jadwal distribusi.

- [ ] **Step 7: Run full test suite and commit**

Run: `cmd /c npx vitest run`
Expected: All tests pass (159 existing + all new tests).
Commit task 6 alarm kedaluwarsa kritis.

---

### Task 7: Full System Verification & Regression Check

**Files:**
- Run all test suites
- Test production build (`npm run build`)

- [ ] **Step 1: Run comprehensive test suite**

Run: `cmd /c npx vitest run`
Expected: 100% PASS across all test files.

- [ ] **Step 2: Run production Next.js build verification**

Run: `cmd /c npm run build`
Expected: Successful compile and static generation without type or lint errors.

- [ ] **Step 3: Final Commit**

Commit all finalized features and update documentation if necessary.
