@echo off
REM VTS Otomatik Runner - Basit Versiyon
echo ========================================
echo   VTS OTOMATIK CALISTIRICI
echo   (Basitlestirilmis - Manuel Login)
echo ========================================
echo.

REM Python kurulu mu kontrol et
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Python bulunamadi!
    echo Lutfen Python'u yukleyin: https://python.org
    pause
    exit /b 1
)

echo [OK] Python bulundu
echo.

REM Selenium kurulu mu kontrol et
python -c "import selenium" >nul 2>&1
if %errorlevel% neq 0 (
    echo [UYARI] Selenium kutuphanesi bulunamadi!
    echo Selenium yukleniyor...
    pip install selenium webdriver-manager
    echo.
)

echo [OK] Selenium hazir
echo.

REM Mevcut Chrome'u kapat (opsiyonel)
echo ========================================
echo   CHROME DEBUG MODU BASLATILIYOR...
echo ========================================
echo.
echo Chrome tarayicisi debug modda aciliyor...
echo VTS'ye giris yapin: https://vts.kentkart.com.tr
echo.

REM Chrome'u debug modda başlat (arka planda)
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome_vts_debug" https://vts.kentkart.com.tr

REM Chrome'un açılmasını bekle
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   VTS'YE GIRIS YAPIN
echo ========================================
echo.
echo 1. Acilan Chrome penceresinde VTS'ye giris yapin
echo 2. Giris yaptiktan sonra bu pencereye donun
echo 3. Herhangi bir tusa basin...
echo.
pause

echo.
echo ========================================
echo   SCRIPT BASLATILIYOR...
echo ========================================
echo.

REM Ana script'i çalıştır
python vts_auto_runner.py

echo.
echo ========================================
echo   ISLEM TAMAMLANDI
echo ========================================
echo.
echo Chrome penceresini kapatin veya acik birakin
echo.
pause
