#!/bin/bash

# Excel Parser Test Runner
# Linux/Mac/WSL için test script

set -e

echo "========================================"
echo "🚀 Excel Parser Test Runner"
echo "========================================"
echo ""

# Python kontrolü
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 bulunamadı"
    echo "Lütfen Python3'ü yükleyin: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python3 bulundu: $(python3 --version)"

# Bağımlılıklar yükleme
echo ""
echo "📦 Bağımlılıklar yükleniyor..."
pip install -q -r test_requirements.txt
echo "✅ Bağımlılıklar yüklendi"

# Test dosyası kontrolü
if [ $# -eq 0 ]; then
    echo ""
    echo "❌ Hata: Excel dosya yolu gerekli"
    echo ""
    echo "Kullanım:"
    echo "  ./run_test.sh <excel_dosyası>"
    echo ""
    echo "Örnekler:"
    echo '  ./run_test.sh "49_TCD49A_2025_10_14.xlsx"'
    echo '  ./run_test.sh "/path/to/file.xlsx"'
    exit 1
fi

EXCEL_FILE="$1"

if [ ! -f "$EXCEL_FILE" ]; then
    echo "❌ Dosya bulunamadı: $EXCEL_FILE"
    exit 1
fi

echo ""
echo "📄 Dosya: $EXCEL_FILE"
echo ""

# Debug script'i çalıştır
echo "🔧 Debug modu..."
echo ""
python3 debug_excel.py "$EXCEL_FILE"

echo ""
echo "📊 Detaylı test..."
echo ""
python3 excel_parser_test.py "$EXCEL_FILE"

echo ""
echo "✅ Test tamamlandı!"
