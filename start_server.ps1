# Bus Control - PowerShell Başlatıcı
# Kullanım: .\start_server.ps1

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 Bus Control - Basit Sunucu Başlatıcı" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Python kontrolü
Write-Host "🔍 Python kontrol ediliyor..." -ForegroundColor White
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python bulundu: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ HATA: Python bulunamadı!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Python'u yüklemek için:" -ForegroundColor Yellow
    Write-Host "https://www.python.org/downloads/" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Devam etmek için Enter'a basın"
    exit 1
}

Write-Host ""

# Flask kontrolü
Write-Host "🔍 Flask kontrol ediliyor..." -ForegroundColor White
$flaskInstalled = pip show flask 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "📦 Flask kurulu değil, yükleniyor..." -ForegroundColor Yellow
    Write-Host ""
    pip install -r simple_requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Paket yükleme hatası!" -ForegroundColor Red
        Read-Host "Devam etmek için Enter'a basın"
        exit 1
    }
    Write-Host ""
    Write-Host "✅ Paketler yüklendi" -ForegroundColor Green
} else {
    Write-Host "✅ Flask kurulu" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🌐 Sunucu başlatılıyor..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tarayıcınızda şu adresi açın:" -ForegroundColor White
Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Durdurmak için: Ctrl+C" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Sunucuyu başlat
python simple_server.py
