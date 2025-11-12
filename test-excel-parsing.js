#!/usr/bin/env node
/**
 * Test Script - Excel Parsing Debugger
 * Lokal olarak Excel dosyalarını parse etmek için kullanılır
 * 
 * Kullanım:
 * node test-excel-parsing.js "path/to/file.xlsx"
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('❌ Hata: Dosya yolu gerekli');
  console.log('Kullanım: node test-excel-parsing.js "path/to/file.xlsx"');
  process.exit(1);
}

const filePath = process.argv[2];

if (!fs.existsSync(filePath)) {
  console.error(`❌ Hata: Dosya bulunamadı: ${filePath}`);
  process.exit(1);
}

console.log(`\n📄 Excel Parsing Test`);
console.log(`${'='.repeat(60)}`);
console.log(`Dosya: ${filePath}\n`);

try {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { 
    cellFormula: false, 
    cellStyles: false,
    cellDates: true
  });

  console.log(`📚 Sheet Adları: ${workbook.SheetNames.join(', ')}`);
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(worksheet['!ref']);

  console.log(`📋 İlk Sheet: ${sheetName}`);
  console.log(`📊 Aralık: ${worksheet['!ref']}`);
  console.log(`📊 Satırlar: ${range.s.r} - ${range.e.r} (Toplam: ${range.e.r - range.s.r + 1})`);
  console.log(`📊 Sütunlar: ${range.s.c} - ${range.e.c} (Toplam: ${range.e.c - range.s.c + 1})\n`);

  // İlk 15 satırı göster
  console.log(`📋 İLK 15 SATIR:\n`);
  for (let r = 0; r <= Math.min(14, range.e.r); r++) {
    console.log(`Satır ${String(r + 1).padStart(2, ' ')}:`);
    for (let c = 0; c <= Math.min(15, range.e.c); c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddr];
      const colLetter = XLSX.utils.encode_col(c);
      
      if (cell && cell.v !== undefined && cell.v !== null) {
        const value = String(cell.v).substring(0, 20);
        console.log(`  ${colLetter.padEnd(2)}: ${value}`);
      }
    }
    console.log('');
  }

  // Tarife sütunlarını bul
  console.log(`\n🔍 TARIFE SÜTUNLARINI ARIYORUM (T01, T02, ...):\n`);
  const tarifeColumns = [];
  for (let headerRow = 0; headerRow <= Math.min(15, range.e.r); headerRow++) {
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v) {
        const value = String(cell.v).trim().toUpperCase();
        if (value.match(/^T\d+$/)) {
          const colLetter = XLSX.utils.encode_col(col);
          console.log(`✅ BULUNDU: ${colLetter} (sütun ${col}) = ${value} (satır ${headerRow + 1})`);
          
          if (!tarifeColumns.find(t => t.name === value)) {
            tarifeColumns.push({
              name: value,
              colIndex: col,
              colLetter: colLetter,
              headerRow: headerRow
            });
          }
        }
      }
    }
  }

  if (tarifeColumns.length === 0) {
    console.log('❌ Tarife sütunu bulunamadı!');
  } else {
    console.log(`\n✅ ${tarifeColumns.length} Tarife sütunu bulundu\n`);
  }

  // B sütunundaki "Kalkış"/"Dönüş" değerlerini bul
  console.log(`\n🔍 B SÜTUNUNDA "KALKIŞ"/"DÖNÜŞ" ARIYORUM:\n`);
  const hareketRows = [];
  for (let r = 0; r <= range.e.r; r++) {
    const bCellAddr = XLSX.utils.encode_cell({ r, c: 1 });
    const bCell = worksheet[bCellAddr];
    
    if (bCell && bCell.v) {
      const value = String(bCell.v).trim();
      if (value === 'Kalkış' || value === 'Dönüş') {
        console.log(`✅ BULUNDU: Satır ${r + 1} = "${value}"`);
        hareketRows.push({ row: r, hareket: value });
      }
    }
  }

  if (hareketRows.length === 0) {
    console.log('❌ Hareket satırı bulunamadı!');
  } else {
    console.log(`\n✅ ${hareketRows.length} Hareket satırı bulundu\n`);
  }

  // Örnek: ilk hareket satırının verilerini göster
  if (hareketRows.length > 0 && tarifeColumns.length > 0) {
    const exampleRow = hareketRows[0];
    console.log(`\n📊 ÖRNEK VERILER (${exampleRow.hareket} satırı ${exampleRow.row + 1}):\n`);
    
    for (const tarife of tarifeColumns.slice(0, 5)) {
      const cellAddr = XLSX.utils.encode_cell({ r: exampleRow.row, c: tarife.colIndex });
      const cell = worksheet[cellAddr];
      const value = cell ? cell.v : '(boş)';
      console.log(`  ${tarife.name}: ${value} (${cellAddr})`);
    }
  }

  // Merged hücreler
  const merges = worksheet['!merges'] || [];
  if (merges.length > 0) {
    console.log(`\n🔗 MERGED HÜCRELER (${merges.length} adet):\n`);
    for (let i = 0; i < Math.min(10, merges.length); i++) {
      const merge = merges[i];
      console.log(`  ${XLSX.utils.encode_range(merge)}`);
    }
    if (merges.length > 10) {
      console.log(`  ... ve ${merges.length - 10} tane daha`);
    }
  }

  console.log(`\n${'='.repeat(60)}\n`);

} catch (err) {
  console.error('❌ Hata:', err.message);
  console.error(err.stack);
  process.exit(1);
}
