@echo off
chcp 65001 >nul
title VTS Otomatik Güncelleme
color 0A

echo ================================================
echo    VTS OTOMATİK GÜNCELLEME SİSTEMİ
echo ================================================
echo.

REM Python kontrolü
echo [1/5] Python kontrol ediliyor...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python bulunamadı!
    echo.
    echo Python yüklü değil. Lütfen Python 3.x yükleyin:
    echo https://www.python.org/downloads/
    echo.
    echo İndirme sırasında "Add Python to PATH" seçeneğini işaretleyin!
    pause
    exit /b 1
)
echo ✅ Python bulundu

REM Selenium kontrolü ve kurulum
echo.
echo [2/5] Gerekli paketler kontrol ediliyor...
python -c "import selenium" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Selenium bulunamadı, yükleniyor...
    pip install selenium
    if errorlevel 1 (
        echo ❌ Selenium yüklenemedi!
        pause
        exit /b 1
    )
    echo ✅ Selenium yüklendi
) else (
    echo ✅ Selenium mevcut
)

REM Chrome WebDriver kontrolü
echo.
echo [3/5] Chrome WebDriver kontrol ediliyor...
python -c "from selenium import webdriver; from selenium.webdriver.chrome.service import Service; from webdriver_manager.chrome import ChromeDriverManager" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WebDriver Manager bulunamadı, yükleniyor...
    pip install webdriver-manager
    if errorlevel 1 (
        echo ❌ WebDriver Manager yüklenemedi!
        pause
        exit /b 1
    )
    echo ✅ WebDriver Manager yüklendi
) else (
    echo ✅ WebDriver Manager mevcut
)

REM Requests kütüphanesi kontrolü
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Requests bulunamadı, yükleniyor...
    pip install requests
)

echo.
echo [4/5] VTS otomasyonu başlatılıyor...
echo.
echo ================================================
echo   🚀 OTOMATIK İŞLEM BAŞLIYOR
echo ================================================
echo.
echo ⏳ Chrome açılacak ve VTS'ye bağlanılacak...
echo ⏳ Lütfen VTS'ye GİRİŞ YAPIN (kullanıcı adı/şifre)
echo ⏳ Giriş yaptıktan sonra script otomatik devam edecek!
echo.

REM Python scriptini çalıştır
python vts_auto_desktop.py

if errorlevel 1 (
    echo.
    echo ❌ İşlem başarısız!
    pause
    exit /b 1
)

echo.
echo ================================================
echo   ✅ İŞLEM TAMAMLANDI!
echo ================================================
echo.
pause
