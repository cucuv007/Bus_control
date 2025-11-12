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
    
    // D sütunundan başlayarak T ile başlayan sütunları bul
    const tarifeColumns = [];
    for (let col = 3; col <= range.e.c; col++) { // D sütunu = 3
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v) {
        const value = String(cell.v).trim();
        if (value.match(/^T\d+$/i)) {
          tarifeColumns.push({
            name: value.toUpperCase(),
            colIndex: col,
            colLetter: XLSX.utils.encode_col(col)
          });
        }
      }
    }

    if (tarifeColumns.length === 0) {
      console.error('❌ No tarife columns found');
      return res.status(400).json({ 
        success: false,
        error: 'T01, T02... sütunları bulunamadı (D sütunundan itibaren)'
      });
    }

    console.log(`🚌 Tarifeler: ${tarifeColumns.map(t => `${t.name}(${t.colLetter})`).join(', ')}`);

    // Verileri topla
    const dataToInsert = [];

    // Her satırı kontrol et
    for (let row = 1; row <= range.e.r; row++) {
      // B sütunundaki değeri al
      const bCellAddress = XLSX.utils.encode_cell({ r: row, c: B_COL });
      const bCell = worksheet[bCellAddress];
      
      if (!bCell || !bCell.v) continue;
      
      const hareketValue = String(bCell.v).trim();
      
      // Sadece "Kalkış" veya "Dönüş" satırlarını işle
      if (hareketValue !== 'Kalkış' && hareketValue !== 'Dönüş') {
        continue;
      }

      console.log(`\n📍 Row ${row + 1}: Hareket = ${hareketValue}`);

      // Her tarife sütunu için değeri al
      for (const tarife of tarifeColumns) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: tarife.colIndex });
        const cell = worksheet[cellAddress];
        
        // Birleştirilmiş hücre kontrolü
        const merges = worksheet['!merges'] || [];
        let isMerged = false;
        
        for (const merge of merges) {
          if (row >= merge.s.r && row <= merge.e.r && 
              tarife.colIndex >= merge.s.c && tarife.colIndex <= merge.e.c) {
            isMerged = true;
            break;
          }
        }

        // Birleştirilmiş hücreleri atla
        if (isMerged) {
          console.log(`  ⚠️ ${cellAddress} birleştirilmiş, atlandı`);
          continue;
        }

        if (cell && cell.v) {
          let timeValue = String(cell.v).trim();
          
          // Excel time formatını düzelt
          if (typeof cell.v === 'number' && cell.v > 0 && cell.v < 1) {
            const totalSeconds = Math.round(cell.v * 86400);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            timeValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
          } else if (timeValue.match(/^\d{1,2}:\d{2}$/)) {
            timeValue = `${timeValue}:00`;
          } else if (!timeValue.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
            console.warn(`  ⚠️ Invalid time: ${cellAddress}: "${timeValue}"`);
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

          console.log(`  ✅ ${cellAddress} (${tarife.name}): ${timeValue}`);
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
    await supabase.from(tableName).delete().neq('Tarife', '___IMPOSSIBLE___');

    console.log(`🔥 Inserting ${dataToInsert.length} records...`);
    
    const { error: insertError } = await supabase
      .from(tableName)
      .insert(dataToInsert);

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return res.status(500).json({ 
        success: false,
        error: 'Veri eklenemedi: ' + insertError.message
      });
    }

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
