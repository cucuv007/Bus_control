@echo off
REM VTS Otomatik Runner - Windows Batch Script
echo ========================================
echo   VTS OTOMATIK CALISTIRICI
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
    pip install selenium
    echo.
)

echo [OK] Selenium hazir
echo.

REM Chrome WebDriver kontrolü
python -c "from selenium import webdriver; webdriver.Chrome()" >nul 2>&1
if %errorlevel% neq 0 (
    echo [UYARI] ChromeDriver bulunamadi!
    echo ChromeDriver yukleniyor...
    pip install webdriver-manager
    echo.
)

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
pause
