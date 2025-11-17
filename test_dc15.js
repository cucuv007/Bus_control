const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('C:\\Users\\utkuesin.kurucu\\Downloads\\15_DC15_2025_09_13.xlsx');
  
  const worksheet = workbook.worksheets[0];
  
  console.log('=== Kalkış Row 17 (K17, L17, M17) ===');
  const row17 = worksheet.getRow(17);
  for (let col = 11; col <= 13; col++) {
    const cell = row17.getCell(col);
    console.log(`\n${String.fromCharCode(64 + col)}17:`);
    console.log(`  Value: ${cell.value}`);
    console.log(`  Font: ${JSON.stringify(cell.font)}`);
    console.log(`  Fill: ${JSON.stringify(cell.fill)}`);
  }
  
  console.log('\n\n=== Row 18 (below Kalkış) ===');
  const row18 = worksheet.getRow(18);
  for (let col = 11; col <= 13; col++) {
    const cell = row18.getCell(col);
    console.log(`\n${String.fromCharCode(64 + col)}18:`);
    console.log(`  Value: ${cell.value}`);
    console.log(`  Font: ${JSON.stringify(cell.font)}`);
  }
  
  console.log('\n\n=== Dönüş Row 21 (K21, L21, M21) ===');
  const row21 = worksheet.getRow(21);
  for (let col = 11; col <= 13; col++) {
    const cell = row21.getCell(col);
    console.log(`\n${String.fromCharCode(64 + col)}21:`);
    console.log(`  Value: ${cell.value}`);
    console.log(`  Font: ${JSON.stringify(cell.font)}`);
  }
  
  console.log('\n\n=== Row 22 (below Dönüş) ===');
  const row22 = worksheet.getRow(22);
  for (let col = 11; col <= 13; col++) {
    const cell = row22.getCell(col);
    console.log(`\n${String.fromCharCode(64 + col)}22:`);
    console.log(`  Value: ${cell.value}`);
    console.log(`  Font: ${JSON.stringify(cell.font)}`);
  }
}

test().catch(console.error);
