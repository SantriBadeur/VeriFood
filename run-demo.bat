@echo off
setlocal enabledelayedexpansion

:: SisaBerkah Demo Runner Script for Windows
:: Double-click or run from command line to start the web demo

title SisaBerkah - Food Bank Platform Demo
cd /d "%~dp0"

echo =====================================================================
echo          SisaBerkah - Food Bank Management Platform
echo                   Menyiapkan Demo Web...
echo =====================================================================
echo.

:: 1. Periksa ketersediaan Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di sistem ini!
    echo Silakan unduh dan pasang Node.js dari: https://nodejs.org/
    echo.
    echo Tekan tombol apa saja untuk keluar...
    pause >nul
    exit /b 1
)

:: 2. Pastikan file .env ada
if not exist "%~dp0.env" (
    echo [INFO] Membuat file .env dengan konfigurasi default...
    echo DATABASE_URL="file:./dev.db" > "%~dp0.env"
)

:: 3. Periksa dependensi node_modules
if not exist "%~dp0node_modules" (
    echo [INFO] Folder node_modules belum ditemukan.
    echo [INFO] Mengunduh dan memasang dependensi via npm install...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal memasang dependensi.
        pause
        exit /b 1
    )
)

:: 4. Periksa dan siapkan database SQLite dan Prisma Client
if not exist "%~dp0prisma\dev.db" (
    echo [INFO] Database SQLite belum ditemukan. Menyiapkan skema database...
    call npx.cmd prisma db push --skip-generate
    echo [INFO] Menjalankan seeding data awal akun demo...
    call npx.cmd prisma db seed
)

:: 5. Pastikan Prisma Client ter-generate
if not exist "%~dp0node_modules\@prisma\client" (
    echo [INFO] Menghasilkan Prisma Client...
    call npx.cmd prisma generate
)

:: 6. Buka browser secara otomatis setelah jeda 3 detik
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 7. Tampilkan info akun demo dan panduan ke pengguna
cls
echo =====================================================================
echo            SisaBerkah - Food Bank Management Platform
echo                     DEMO DAN PENGEMBANGAN LOKAL
echo =====================================================================
echo.
echo  Aplikasi web dapat diakses di:
echo  --^> URL: http://localhost:3000
echo.
echo  -----------------------------------------------------------------
echo  KREDENSIAL AKUN DEMO:
echo  -----------------------------------------------------------------
echo  1. ADMINISTRATOR
echo     Email    : admin@sisaberkah.org
echo     Password : admin123
echo     Hak Akses: Kelola Makanan, Koreksi Stok, Penjadwalan Distribusi,
echo                Kelola Donatur, Penerima Manfaat, Pengguna, Laporan.
echo.
echo  2. RELAWAN LAPANGAN
echo     Email    : relawan@sisaberkah.org
echo     Password : relawan123
echo     Hak Akses: Input Makanan Masuk, Update Status Distribusi Lapangan.
echo  -----------------------------------------------------------------
echo.
echo  [INFO] Menjalankan Next.js development server...
echo  Browser default akan terbuka otomatis di http://localhost:3000
echo.
echo  Tekan Ctrl+C di jendela ini untuk menghentikan server demo.
echo =====================================================================
echo.

:: 8. Jalankan Next.js server
call npm.cmd run dev

echo.
echo [INFO] Server demo SisaBerkah telah dihentikan.
echo Tekan tombol apa saja untuk menutup jendela ini...
pause >nul
