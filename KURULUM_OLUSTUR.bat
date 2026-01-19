@echo off
chcp 65001 >nul
title KasaBurger POS - Windows Kurulum Paketi Oluşturucu
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║   🍔 KASABURGER POS - WINDOWS KURULUM PAKETİ OLUŞTURUCU     ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: Node.js kontrolü
echo [1/4] Node.js kontrolü yapılıyor...
node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ❌ HATA: Node.js bulunamadı!
    echo.
    echo  Lütfen Node.js'i indirip kurun:
    echo  https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi
    echo.
    echo  Kurulumdan sonra bu dosyayı tekrar çalıştırın.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo  ✓ Node.js sürümü: %%i

:: Bağımlılıkları yükle
echo.
echo [2/4] Bağımlılıklar yükleniyor (bu 2-3 dakika sürebilir)...
call npm install
if errorlevel 1 (
    echo  ❌ HATA: Bağımlılıklar yüklenemedi!
    pause
    exit /b 1
)
echo  ✓ Bağımlılıklar yüklendi

:: Windows build oluştur
echo.
echo [3/4] Windows kurulum paketi oluşturuluyor (bu 3-5 dakika sürebilir)...
echo.
call npm run build:win
if errorlevel 1 (
    echo  ❌ HATA: Build oluşturulamadı!
    pause
    exit /b 1
)

:: Sonuç
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║   ✅ KURULUM PAKETİ BAŞARIYLA OLUŞTURULDU!                  ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo [4/4] Oluşturulan dosyalar:
echo.
echo  📁 dist klasöründe:
echo     • KasaBurger POS Setup 1.0.0.exe  (Installer - bayilere bu gönderilecek)
echo     • KasaBurger POS 1.0.0.exe        (Portable versiyon)
echo.
echo  💡 İpucu: "dist" klasörünü açmak için bir tuşa basın...
pause >nul

:: dist klasörünü aç
start "" "dist"
