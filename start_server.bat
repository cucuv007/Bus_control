@echo off
chcp 65001 >nul
cls
echo ============================================================
echo 🚀 Bus Control - Basit Sunucu Başlatıcı
echo ============================================================
echo.

REM Python kurulu mu kontrol et
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ HATA: Python bulunamadı!
    echo.
    echo Python'u yüklemek için:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo ✅ Python bulundu
echo.

REM Flask kurulu mu kontrol et
pip show flask >nul 2>&1
if errorlevel 1 (
    echo 📦 Flask kurulu değil, yükleniyor...
    echo.
    pip install -r simple_requirements.txt
    if errorlevel 1 (
        echo.
        echo ❌ Paket yükleme hatası!
        pause
        exit /b 1
    )
    echo.
    echo ✅ Paketler yüklendi
) else (
    echo ✅ Flask kurulu
)

echo.
echo ============================================================
echo 🌐 Sunucu başlatılıyor...
echo ============================================================
echo.
echo Tarayıcınızda şu adresi açın:
echo http://localhost:5000
echo.
echo Durdurmak için: Ctrl+C
echo ============================================================
echo.

REM Sunucuyu başlat
python simple_server.py

pause
