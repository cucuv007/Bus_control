#!/usr/bin/env python3
"""
B Sütunu Karakter Analizi
Kalkış/Dönüş kelimelerinin karakter kodlarını gösterir
"""

import openpyxl
import sys

if len(sys.argv) < 2:
    print("❌ Kullanım: python check_b_column.py file.xlsx")
    sys.exit(1)

file_path = sys.argv[1]

wb = openpyxl.load_workbook(file_path)
ws = wb.active

print(f"\n{'='*70}")
print(f"B SÜTUNU DETAYLI ANALİZ")
print(f"{'='*70}\n")

for row_idx in range(7, 41):
    cell = ws.cell(row_idx, 2)  # B sütunu
    if not cell.value:
        continue
    
    value = str(cell.value).strip()
    if not value:
        continue
    
    # Karakter kodlarını göster
    char_codes = [ord(c) for c in value]
    char_repr = ' '.join([f"{c}({ord(c)})" for c in value])
    
    is_kalkis = (value == 'Kalkış')
    is_donus = (value == 'Dönüş')
    
    mark = "✅" if (is_kalkis or is_donus) else "  "
    
    print(f"{mark} Satır {row_idx:2d}: '{value}'")
    print(f"    Uzunluk: {len(value)}")
    print(f"    Karakterler: {char_repr}")
    print(f"    Kod dizisi: {char_codes}")
    
    # Eşleşme kontrolü
    if value == 'Kalkış':
        print(f"    ✅ 'Kalkış' ile TAM EŞLEŞİYOR")
    elif value == 'Dönüş':
        print(f"    ✅ 'Dönüş' ile TAM EŞLEŞİYOR")
    elif 'Kalkış' in value or 'Dönüş' in value:
        print(f"    ⚠️  İçinde var ama tam eşleşmiyor!")
    
    print()

print(f"\n{'='*70}")
print(f"REFERANS KARAKTER KODLARI")
print(f"{'='*70}\n")

print("'Kalkış' beklenen kodlar:")
print(f"  K(75) a(97) l(108) k(107) ı(305) ş(351)")
print(f"  Kod dizisi: [75, 97, 108, 107, 305, 351]\n")

print("'Dönüş' beklenen kodlar:")
print(f"  D(68) ö(246) n(110) ü(252) ş(351)")
print(f"  Kod dizisi: [68, 246, 110, 252, 351]\n")
