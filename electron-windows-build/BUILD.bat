@echo off
echo ========================================
echo   KasaBurger POS - Windows Build Script
echo ========================================
echo.

:: Node.js kontrolü
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi!
    echo Lutfen https://nodejs.org adresinden Node.js yukleyin.
    pause
    exit /b 1
)

echo [OK] Node.js bulundu
node --version

:: npm kontrolü
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] npm bulunamadi!
    pause
    exit /b 1
)

echo [OK] npm bulundu
npm --version
echo.

:: Bağımlılıkları yükle
echo [*] Bagimliliklar yukleniyor...
call npm install
if %errorlevel% neq 0 (
    echo [HATA] Bagimlilik yukleme basarisiz!
    pause
    exit /b 1
)
echo [OK] Bagimliliklar yuklendi
echo.

:: Build işlemi
echo [*] Windows installer olusturuluyor...
echo    Bu islem 3-5 dakika surebilir...
call npm run build:win
if %errorlevel% neq 0 (
    echo [HATA] Build basarisiz!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD BASARILI!
echo ========================================
echo.
echo Kurulum dosyalari 'dist' klasorunde:
dir /b dist\*.exe 2>nul
echo.
echo Bu dosyalari bayi bilgisayarlarina kopyalayabilirsiniz.
echo.
pause
