const ExcelJS = require('exceljs');
const fs = require('fs');

function isCellHidden(cell) {
  if (!cell || !cell.value) return false;
  
  try {
    const font = cell.font;
    
    // Font yoksa normal kabul et
    if (!font || !font.color) return false;
    
    // ARGB beyaz kontrolü
    if (font.color.argb) {
      const fontColor = font.color.argb;
      const fontRGB = fontColor.slice(-6).toUpperCase();
      if (fontRGB === 'FFFFFF') {
        console.log(`  ⚠️ ATLANDI (ARGB beyaz): ${cell.address} = ${cell.value}`);
        return true;
      }
    }
    
    // Theme-based beyaz kontrolü
    if (font.color.theme !== undefined) {
      const theme = font.color.theme;
      const tint = font.color.tint || 0;
      
      if (theme === 0 && tint >= 0) {
        console.log(`  ⚠️ ATLANDI (Theme 0): ${cell.address} = ${cell.value} | theme=${theme}, tint=${tint}`);
        return true;
      }
    }
    
  } catch (err) {
    console.error('Cell hidden check error:', err);
  }
  
  return false;
}

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('C:\\Users\\utkuesin.kurucu\\Downloads\\15_DC15_2025_09_13.xlsx');
  
  const worksheet = workbook.worksheets[0];
  console.log(`Worksheet: ${worksheet.name}\n`);
  
  // Tarife başlıklarını bul
  console.log('=== Finding tarife headers ===');
  let tarifeColumns = [];
  for (let rowNum = 1; rowNum <= 20; rowNum++) {
    const headerRow = worksheet.getRow(rowNum);
    const tempCols = [];
    
    for (let col = 4; col <= 30; col++) {
      const cell = headerRow.getCell(col);
      if (!cell || !cell.value) continue;
      const headerValue = String(cell.value).trim();
      
      const match = headerValue.match(/^(T\d{2})(\s*\(A\))?$/);
      if (match) {
        tempCols.push({ col, name: match[1], hasA: !!match[2] });
      }
    }
    
    if (tempCols.length > 0) {
      tarifeColumns = tempCols;
      console.log(`Found ${tempCols.length} tarife columns in row ${rowNum}: ${tempCols.map(t => t.name).join(', ')}\n`);
      break;
    }
  }
  
  // Row 17 (Kalkış) kontrolü
  console.log('=== Row 17 (Kalkış) - Checking K17, L17, M17 ===');
  const row17 = worksheet.getRow(17);
  console.log(`B17: ${row17.getCell(2).value}\n`);
  
  for (let col = 11; col <= 13; col++) {
    const cell = row17.getCell(col);
    const tarifeName = tarifeColumns.find(t => t.col === col)?.name || 'Unknown';
    
    console.log(`${String.fromCharCode(64 + col)}17 (${tarifeName}):`);
    console.log(`  Value: ${cell.value}`);
    console.log(`  Font: ${JSON.stringify(cell.font)}`);
    console.log(`  isCellHidden: ${isCellHidden(cell)}`);
    console.log('');
  }
  
  // Row 21 (Dönüş) kontrolü
  console.log('\n=== Row 21 (Dönüş) - Checking K21, L21, M21 ===');
  const row21 = worksheet.getRow(21);
  console.log(`B21: ${row21.getCell(2).value}\n`);
  
  for (let col = 11; col <= 13; col++) {
    const cell = row21.getCell(col);
    const tarifeName = tarifeColumns.find(t => t.col === col)?.name || 'Unknown';
    
    console.log(`${String.fromCharCode(64 + col)}21 (${tarifeName}):`);
    console.log(`  Value: ${cell.value}`);
    console.log(`  Font: ${JSON.stringify(cell.font)}`);
    console.log(`  isCellHidden: ${isCellHidden(cell)}`);
    
    // Altındaki hücreyi kontrol et (Dönüş için)
    const row22 = worksheet.getRow(22);
    const cellBelow = row22.getCell(col);
    console.log(`  Below (${String.fromCharCode(64 + col)}22): ${cellBelow.value}`);
    console.log(`  Below isCellHidden: ${isCellHidden(cellBelow)}`);
    console.log('');
  }
}

test().catch(console.error);
