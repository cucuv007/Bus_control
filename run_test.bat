@echo off
REM Excel Parser Test Runner
REM Windows için test script

setlocal enabledelayedexpansion

echo ========================================
echo.🚀 Excel Parser Test Runner
echo ========================================
echo.

REM Python kontrolü
python --version >nul 2>&1
if errorlevel 1 (
    echo.❌ Python bulunamadı
    echo.Lütfen Python'u yükleyin: https://www.python.org/downloads/
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo.✅ Python bulundu: %PYTHON_VERSION%

REM Bağımlılıklar yükleme
echo.
echo.📦 Bağımlılıklar yükleniyor...
pip install -q -r test_requirements.txt
if errorlevel 1 (
    echo.❌ Bağımlılık yüklemesi başarısız
    exit /b 1
)
echo.✅ Bağımlılıklar yüklendi

REM Test dosyası kontrolü
if "%1"=="" (
    echo.
    echo.❌ Hata: Excel dosya yolu gerekli
    echo.
    echo.Kullanım:
    echo.  run_test.bat ^<excel_dosyası^>
    echo.
    echo.Örnekler:
    echo.  run_test.bat "49_TCD49A_2025_10_14.xlsx"
    echo.  run_test.bat "C:\path\to\file.xlsx"
    exit /b 1
)

set EXCEL_FILE=%1

if not exist "%EXCEL_FILE%" (
    echo.❌ Dosya bulunamadı: %EXCEL_FILE%
    exit /b 1
)

echo.
echo.📄 Dosya: %EXCEL_FILE%
echo.

REM Debug script'i çalıştır
echo.🔧 Debug modu...
echo.
python debug_excel.py "%EXCEL_FILE%"

echo.
echo.📊 Detaylı test...
echo.
python excel_parser_test.py "%EXCEL_FILE%"

echo.
echo.✅ Test tamamlandı!

pause
