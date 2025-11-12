// pages/api/process-excel.js
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Dosya adından tablo adını çıkar
// Format: XX_TABLENAME_YYYY_MM_DD.xlsx
// Örnek: 01_VF01_2025_11_10.xlsx -> VF01
// Örnek: 49_TCD49A_2025_10_14.xlsx -> TCD49A
function extractTableName(filename) {
  const cleaned = filename.replace('.xlsx', '').replace('.xls', '');
  const parts = cleaned.split('_');
  
  if (parts.length >= 3) {
    return parts[1]; // İkinci "_" ile üçüncü "_" arasındaki değer
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('\n🚀 API Request received');
    console.log('Headers:', JSON.stringify(req.headers));
    
    const { fileName, fileData } = req.body;

    console.log('Body keys:', Object.keys(req.body));
    console.log('fileName:', fileName);
    console.log('fileData exists:', !!fileData);
    console.log('fileData length:', fileData?.length);

    if (!fileName || !fileData) {
      console.error('❌ Missing parameters');
      return res.status(400).json({ 
        success: false,
        error: 'fileName ve fileData gerekli',
        received: { fileName: !!fileName, fileData: !!fileData }
      });
    }

    console.log(`📄 File: ${fileName}`);

    const tableName = extractTableName(fileName);
    console.log(`🔍 Extracted table name: ${tableName}`);
    
    if (!tableName) {
      return res.status(400).json({ 
        success: false,
        error: `Tablo adı çıkarılamadı. Format: XX_TABLENAME_YYYY_MM_DD.xlsx (Dosya: ${fileName})` 
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 File: ${fileName}`);
    console.log(`📋 Table: ${tableName}`);
    console.log(`${'='.repeat(60)}`);

    // Excel dosyasını oku
    console.log('📖 Reading Excel buffer...');
    const buffer = Buffer.from(fileData, 'base64');
    console.log(`✅ Buffer created: ${buffer.length} bytes`);
    
    const workbook = XLSX.read(buffer, { 
      cellFormula: false, 
      cellStyles: false,
      cellDates: true
    });

    console.log(`📚 Sheets: ${workbook.SheetNames.join(', ')}`);

    // İlk sheet'i kullan
    const sheetName = workbook.SheetNames[0];
    console.log(`📋 Using: ${sheetName}`);

    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    console.log(`📊 Range: ${worksheet['!ref']}`);
    console.log(`📊 Rows: ${range.s.r} to ${range.e.r}, Cols: ${range.s.c} to ${range.e.c}`);

    // B sütunu = 1 (0-indexed)
    const B_COL = 1;
    
    // İlk 10 satırın tüm değerlerini logla (DEBUG)
    console.log('\n📋 İLK 10 SATIR İÇERİĞİ:');
    for (let r = 0; r <= Math.min(9, range.e.r); r++) {
      console.log(`\n  Satır ${r + 1}:`);
      for (let col = 0; col <= Math.min(range.e.c, 15); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c: col });
        const cell = worksheet[cellAddress];
        const colLetter = XLSX.utils.encode_col(col);
        if (cell && cell.v) {
          console.log(`    ${colLetter}(${col}): "${cell.v}"`);
        }
      }
    }
    
    // D sütunundan başlayarak T ile başlayan sütunları bul
    const tarifeColumns = [];
    
    // Önce tüm satırları tara (başlık farklı satırda olabilir)
    console.log('\n🔍 Tarife sütunlarını arıyor (T01, T02 gibi)...');
    for (let headerRow = 0; headerRow <= Math.min(15, range.e.r); headerRow++) {
      for (let col = 3; col <= range.e.c; col++) {  // D sütundan başla (col=3)
        const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v) {
          const value = String(cell.v).trim().toUpperCase();
          const colLetter = XLSX.utils.encode_col(col);
          
          // T01, T02 gibi başlıkları bul
          if (value.match(/^T\d+$/)) {
            console.log(`  ✅ BULUNDU: ${colLetter}(${col}) Satır ${headerRow + 1} = ${value}`);
            
            // Henüz eklenmemişse ekle
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
      console.error('❌ No tarife columns found');
      console.log('\n📋 EXCEL YAPISI:');
      console.log('Sheet adı:', sheetName);
      console.log('Toplam satır:', range.e.r + 1);
      console.log('Toplam sütun:', range.e.c + 1);
      
      // İlk 5 satırı göster
      console.log('\nİlk 5 satır:');
      for (let r = 0; r <= Math.min(4, range.e.r); r++) {
        const rowData = [];
        for (let c = 0; c <= Math.min(10, range.e.c); c++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
          rowData.push(cell ? cell.v : null);
        }
        console.log(`Satır ${r + 1}:`, rowData);
      }
      
      return res.status(400).json({ 
        success: false,
        error: 'T01, T02... sütunları bulunamadı',
        debug: {
          sheetName: sheetName,
          totalRows: range.e.r + 1,
          totalCols: range.e.c + 1,
          firstRowSample: (() => {
            const row = [];
            for (let c = 0; c <= Math.min(10, range.e.c); c++) {
              const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c })];
              row.push(cell ? cell.v : null);
            }
            return row;
          })(),
          instructions: 'Excel dosyanızda T01, T02, T03 gibi başlıklar olmalı. Lütfen dosyanızın yapısını kontrol edin.'
        }
      });
    }

    console.log(`\n🚌 ${tarifeColumns.length} Tarife sütunu bulundu:`);
    tarifeColumns.forEach(t => {
      console.log(`  ${t.name} -> ${t.colLetter} (satır ${t.headerRow + 1})`);
    });
    
    // En yaygın headerRow'u bul
    const headerRowCounts = {};
    tarifeColumns.forEach(t => {
      headerRowCounts[t.headerRow] = (headerRowCounts[t.headerRow] || 0) + 1;
    });
    const mainHeaderRow = parseInt(Object.keys(headerRowCounts).sort((a, b) => 
      headerRowCounts[b] - headerRowCounts[a]
    )[0]);
    
    console.log(`\n📊 Main header row: ${mainHeaderRow + 1}`);

    // Verileri topla
    const dataToInsert = [];
    
    // B sütunundaki tüm değerleri göster (debug)
    console.log('\n🔍 B sütunundaki değerler:');
    for (let r = 0; r <= Math.min(20, range.e.r); r++) {
      const bCellAddress = XLSX.utils.encode_cell({ r, c: 1 });
      const bCell = worksheet[bCellAddress];
      if (bCell && bCell.v) {
        console.log(`  Satır ${r + 1}: "${bCell.v}"`);
      }
    }

    // Her satırı kontrol et
    console.log('\n🔄 Satırları işleme başlıyor...');
    for (let row = 0; row <= range.e.r; row++) {
      // B sütunundaki değeri al
      const bCellAddress = XLSX.utils.encode_cell({ r: row, c: 1 });  // B = index 1
      const bCell = worksheet[bCellAddress];
      
      if (!bCell || !bCell.v) continue;
      
      const hareketValue = String(bCell.v).trim();
      
      // Sadece "Kalkış" veya "Dönüş" satırlarını işle (küçük-büyük harf duyarsız)
      if (hareketValue !== 'Kalkış' && hareketValue !== 'Dönüş') {
        continue;
      }

      console.log(`\n📍 Row ${row + 1}: Hareket = "${hareketValue}"`);

      // Her tarife sütunu için değeri al
      for (const tarife of tarifeColumns) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: tarife.colIndex });
        const cell = worksheet[cellAddress];
        
        // Birleştirilmiş hücre kontrolü
        const merges = worksheet['!merges'] || [];
        let isMerged = false;
        let mergedCell = cell;
        
        for (const merge of merges) {
          // Mevcut hücre merged range içindeyse
          if (row >= merge.s.r && row <= merge.e.r && 
              tarife.colIndex >= merge.s.c && tarife.colIndex <= merge.e.c) {
            isMerged = true;
            // Top-left hücresinin değerini al
            const topLeftAddr = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
            mergedCell = worksheet[topLeftAddr];
            console.log(`  ⚠️ ${cellAddress} merged, top-left: ${topLeftAddr}`);
            break;
          }
        }

        // Birleştirilmiş veya normal hücrelerin değerini al
        const targetCell = isMerged ? mergedCell : cell;
        
        if (targetCell && targetCell.v) {
          let timeValue = String(targetCell.v).trim();
          
          // Excel time formatını kontrol et ve düzelt
          if (typeof targetCell.v === 'number' && targetCell.v > 0 && targetCell.v < 1) {
            // Excel time format (0-1 arasında decimal)
            const totalSeconds = Math.round(targetCell.v * 86400);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            timeValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
            console.log(`  📊 ${cellAddress}: ${targetCell.v} -> ${timeValue} (decimal format)`);
          } else if (timeValue.match(/^\d{1,2}:\d{2}$/)) {
            // HH:MM format
            timeValue = `${timeValue}:00`;
            console.log(`  ✅ ${cellAddress} (${tarife.name}): ${timeValue}`);
          } else if (timeValue.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
            // HH:MM:SS format (zaten doğru)
            console.log(`  ✅ ${cellAddress} (${tarife.name}): ${timeValue}`);
          } else {
            // Tanımlanamayan format
            console.warn(`  ⚠️ Unknown time format in ${cellAddress}: "${timeValue}"`);
            continue;
          }
          
          dataToInsert.push({
            Tarife: tarife.name,
            Hareket: hareketValue,
            Tarife_Saati: timeValue,
            Onaylanan: null,
            Durum: null,
            Plaka: null
          });
        }
      }
    }

    console.log(`\n📊 Total records: ${dataToInsert.length}`);

    if (dataToInsert.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'B sütununda "Kalkış" veya "Dönüş" ve D+ sütunlarında saat verisi bulunamadı.'
      });
    }

    console.log(`🔧 Creating table: ${tableName}`);
    
    // Tabloyu oluştur
    const createSQL = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        "Tarife" TEXT NOT NULL,
        "Hareket" TEXT NOT NULL,
        "Tarife_Saati" TIME NOT NULL,
        "Onaylanan" TIME,
        "Durum" TEXT,
        "Plaka" TEXT,
        PRIMARY KEY ("Tarife_Saati", "Hareket")
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createSQL
    });

    if (createError) {
      console.error('❌ Create error:', createError);
      return res.status(500).json({ 
        success: false,
        error: 'Tablo oluşturulamadı: ' + createError.message
      });
    }

    console.log(`✅ Table created`);

    // RLS'yi devre dışı bırak
    const disableRLS = `ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY;`;
    await supabase.rpc('exec_sql', { sql: disableRLS });

    console.log(`🗑️ Clearing old data...`);
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('Tarife', '___IMPOSSIBLE___');
    
    if (deleteError) {
      console.warn('⚠️ Delete warning:', deleteError);
    } else {
      console.log('✅ Old data cleared');
    }

    console.log(`🔥 Inserting ${dataToInsert.length} records...`);
    console.log('Sample data:', dataToInsert.slice(0, 3));
    
    const { data: insertData, error: insertError } = await supabase
      .from(tableName)
      .insert(dataToInsert);

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      return res.status(500).json({ 
        success: false,
        error: 'Veri eklenemedi: ' + insertError.message,
        details: insertError
      });
    }

    console.log(`✅ Data inserted:`, insertData);
    console.log(`✅ SUCCESS!\n${'='.repeat(60)}\n`);

    return res.status(200).json({
      success: true,
      tableName: tableName,
      sheetName: sheetName,
      inserted: dataToInsert.length,
      message: `${dataToInsert.length} sefer eklendi`,
      tarifeColumns: tarifeColumns.map(t => t.name)
    });

  } catch (err) {
    console.error('❌ FATAL ERROR:', err);
    console.error('Stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      error: 'Sistem hatası: ' + err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    },
    responseLimit: '50mb'
  }
};
