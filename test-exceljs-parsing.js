#!/usr/bin/env node
/**
 * Test Script - ExcelJS Parsing Debugger
 * process-excel.js ile aynı mantığı kullanarak lokal test yapar
 */

const ExcelJS = require('exceljs');
const fs = require('fs');

if (process.argv.length < 3) {
  console.error('❌ Kullanım: node test-exceljs-parsing.js "path/to/file.xlsx"');
  process.exit(1);
}

const filePath = process.argv[2];

if (!fs.existsSync(filePath)) {
  console.error(`❌ Dosya bulunamadı: ${filePath}`);
  process.exit(1);
}

// process-excel.js'deki fonksiyonlar
function isCellHidden(cell) {
  if (!cell || !cell.value) return false;
  
  const fill = cell.fill;
  const font = cell.font;
  
  if (!fill || !font) return false;
  if (fill.type !== 'pattern') return false;
  if (!fill.fgColor || !font.color) return false;
  
  const bgColor = fill.fgColor.argb;
  const fgColor = font.color.argb;
  
  if (!bgColor || !fgColor) return false;
  
  const bgRGB = bgColor.slice(-6);
  const fgRGB = fgColor.slice(-6);
  
  return bgRGB === fgRGB;
}

function formatTime(value) {
  if (!value) return null;
  
  if (value instanceof Date) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  
  if (typeof value === 'number') {
    if (value >= 0 && value < 1) {
      const totalSeconds = Math.round(value * 24 * 60 * 60);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return null;
  }
  
  if (typeof value === 'string') {
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2];
      const seconds = timeMatch[3] || '00';
      return `${hours}:${minutes}:${seconds}`;
    }
  }
  
  return null;
}

async function testFile() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📄 ExcelJS Parsing Test - process-excel.js mantığı`);
  console.log(`${'='.repeat(70)}\n`);
  console.log(`Dosya: ${filePath}\n`);

  const buffer = fs.readFileSync(filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  console.log(`✅ Sheet: ${worksheet.name}`);
  console.log(`📊 Satır sayısı: ${worksheet.rowCount}\n`);

  // Header bul (T01, T02...)
  const tarifeColumns = [];
  let foundHeaderRow = null;
  
  console.log(`🔍 İlk 20 satırda T01, T02... başlıklarını arıyorum...\n`);
  
  for (let rowNum = 1; rowNum <= 20; rowNum++) {
    const headerRow = worksheet.getRow(rowNum);
    const tempCols = [];
    
    for (let col = 4; col <= 30; col++) {
      const cell = headerRow.getCell(col);
      if (!cell || !cell.value) continue;
      const headerValue = String(cell.value).trim();
      if (headerValue.match(/^T\d{2}$/)) {
        tempCols.push({ col, name: headerValue });
      }
    }
    
    if (tempCols.length > 0) {
      tarifeColumns.push(...tempCols);
      foundHeaderRow = rowNum;
      console.log(`✅ Satır ${rowNum}: ${tempCols.length} tarife başlığı bulundu`);
      console.log(`   ${tempCols.map(t => `${t.name}(col${t.col})`).join(', ')}\n`);
      break;
    }
  }

  if (!foundHeaderRow) {
    console.error('❌ Tarife başlıkları bulunamadı!');
    process.exit(1);
  }

  // Hareket satırlarını bul
  const hareketRows = [];
  const startRowForHareket = foundHeaderRow + 2;
  
  console.log(`🔍 Hareket satırlarını arıyorum (B sütunu, satır ${startRowForHareket}-50)...\n`);
  
  for (let rowNum = startRowForHareket; rowNum <= 50; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const cell = row.getCell(2); // B sütunu
    if (!cell || !cell.value) continue;
    
    const hareketValue = String(cell.value).trim();
    const charCodes = Array.from(hareketValue).map(c => c.charCodeAt(0)).join(',');
    
    console.log(`Satır ${rowNum}: "${hareketValue}" (len:${hareketValue.length}, chars:[${charCodes}])`);
    
    if (hareketValue === 'Kalkış' || hareketValue === 'Dönüş') {
      console.log(`  ✅ BULUNDU: ${hareketValue}`);
      hareketRows.push({ rowNum, hareket: hareketValue });
    }
  }

  console.log(`\n✅ Toplam ${hareketRows.length} hareket satırı bulundu`);
  console.log(`   ${hareketRows.map(h => `${h.hareket}(satır ${h.rowNum})`).join(', ')}\n`);

  // Veri parse
  const dataToInsert = [];
  
  console.log(`${'='.repeat(70)}`);
  console.log(`📊 VERİ PARSE`);
  console.log(`${'='.repeat(70)}\n`);
  
  for (const hareketRow of hareketRows) {
    console.log(`\n--- ${hareketRow.hareket} (Satır ${hareketRow.rowNum}) ---`);
    let addedCount = 0;
    
    for (const tarife of tarifeColumns) {
      const row = worksheet.getRow(hareketRow.rowNum);
      const cell = row.getCell(tarife.col);
      
      if (!cell || !cell.value) continue;
      
      const cellValueStr = String(cell.value).trim();
      if (!cellValueStr) continue;
      
      if (cell.formula) {
        console.log(`  ${tarife.name}: ⚠️  Formül atlandı`);
        continue;
      }
      
      if (isCellHidden(cell)) {
        console.log(`  ${tarife.name}: 🔒 Gizli hücre atlandı`);
        continue;
      }
      
      const timeValue = formatTime(cell.value);
      if (!timeValue) {
        console.log(`  ${tarife.name}: ❌ Zaman formatı geçersiz`);
        continue;
      }

      dataToInsert.push({
        Hareket: hareketRow.hareket,
        Tarife: tarife.name,
        Tarife_Saati: timeValue
      });
      addedCount++;
    }
    
    console.log(`  → ${addedCount} kayıt eklendi`);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 SONUÇ`);
  console.log(`${'='.repeat(70)}\n`);
  console.log(`✅ Toplam ${dataToInsert.length} kayıt parse edildi\n`);

  // Hareket türüne göre grupla
  const kalkisCount = dataToInsert.filter(d => d.Hareket === 'Kalkış').length;
  const donusCount = dataToInsert.filter(d => d.Hareket === 'Dönüş').length;
  
  console.log(`   Kalkış: ${kalkisCount} kayıt`);
  console.log(`   Dönüş:  ${donusCount} kayıt\n`);

  // İlk 5 kaydı göster
  console.log(`📋 İLK 5 KAYIT:\n`);
  dataToInsert.slice(0, 5).forEach((d, i) => {
    console.log(`${i+1}. ${d.Hareket} - ${d.Tarife} - ${d.Tarife_Saati}`);
  });
}

testFile().catch(err => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
