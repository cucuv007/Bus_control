const ExcelJS = require('exceljs');

function isCellHidden(cell) {
  if (!cell || !cell.value) return false;
  
  try {
    const font = cell.font;
    
    if (!font || !font.color) return false;
    
    if (font.color.argb) {
      const fontColor = font.color.argb;
      const fontRGB = fontColor.slice(-6).toUpperCase();
      if (fontRGB === 'FFFFFF') {
        return true;
      }
    }
    
    if (font.color.theme !== undefined) {
      const theme = font.color.theme;
      const tint = font.color.tint || 0;
      
      if (theme === 0 && tint >= 0) {
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
  
  const tarifeColumns = [];
  for (let col = 4; col <= 18; col++) {
    const cell = worksheet.getRow(5).getCell(col);
    if (cell.value && String(cell.value).match(/^T\d{2}$/)) {
      tarifeColumns.push({ col, name: String(cell.value) });
    }
  }
  
  console.log(`Found ${tarifeColumns.length} tarife columns\n`);
  
  const hareketRows = [
    { rowNum: 8, hareket: 'Kalkış' },
    { rowNum: 12, hareket: 'Dönüş' },
    { rowNum: 17, hareket: 'Kalkış' },
    { rowNum: 21, hareket: 'Dönüş' },
    { rowNum: 26, hareket: 'Kalkış' },
    { rowNum: 30, hareket: 'Dönüş' },
    { rowNum: 35, hareket: 'Kalkış' },
    { rowNum: 39, hareket: 'Dönüş' },
    { rowNum: 44, hareket: 'Kalkış' },
    { rowNum: 48, hareket: 'Dönüş' }
  ];
  
  let kalkisCount = 0;
  let donusCount = 0;
  
  for (const hareketRow of hareketRows) {
    let added = 0;
    let skipped = 0;
    
    for (const tarife of tarifeColumns) {
      const row = worksheet.getRow(hareketRow.rowNum);
      const cell = row.getCell(tarife.col);
      
      if (!cell || !cell.value) {
        skipped++;
        continue;
      }
      
      if (isCellHidden(cell)) {
        skipped++;
        continue;
      }
      
      if (hareketRow.hareket === 'Dönüş') {
        const nextRow = worksheet.getRow(hareketRow.rowNum + 1);
        const cellBelow = nextRow.getCell(tarife.col);
        
        const isBelowEmpty = !cellBelow || !cellBelow.value;
        const isBelowWhite = cellBelow && isCellHidden(cellBelow);
        
        if (isBelowEmpty || isBelowWhite) {
          skipped++;
          continue;
        }
      }
      
      added++;
    }
    
    console.log(`${hareketRow.hareket} Row ${hareketRow.rowNum}: ${added} added, ${skipped} skipped`);
    
    if (hareketRow.hareket === 'Kalkış') {
      kalkisCount += added;
    } else {
      donusCount += added;
    }
  }
  
  console.log(`\n=== TOTAL ===`);
  console.log(`Kalkış: ${kalkisCount}`);
  console.log(`Dönüş: ${donusCount}`);
  console.log(`GRAND TOTAL: ${kalkisCount + donusCount}`);
}

test().catch(console.error);
