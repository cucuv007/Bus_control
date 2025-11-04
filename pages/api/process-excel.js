// pages/api/process-excel.js
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function extractTableName(filename) {
  const cleaned = filename.replace('.xlsx', '').replace('.xls', '');
  const parts = cleaned.split('_');
  if (parts.length >= 2) {
    return parts[1];
  }
  return null;
}

function isYellowCell(cell) {
  if (!cell || !cell.s) return false;
  
  const style = cell.s;
  const yellowPatterns = ['ffff00', 'ffffe', 'ffffc', 'ff0', 'ffffff00'];
  
  const checkColor = (colorObj) => {
    if (!colorObj) return false;
    if (colorObj.rgb) {
      const rgb = colorObj.rgb.toLowerCase();
      return yellowPatterns.some(pattern => rgb.includes(pattern));
    }
    if (colorObj.indexed !== undefined) {
      return colorObj.indexed === 13 || colorObj.indexed === 65535;
    }
    if (colorObj.theme !== undefined) {
      return colorObj.theme === 3 || colorObj.theme === 4;
    }
    return false;
  };
  
  if (style.fill) {
    if (checkColor(style.fill.fgColor)) return true;
    if (checkColor(style.fill.bgColor)) return true;
    if (checkColor(style.fill.patternColor)) return true;
  }
  
  if (checkColor(style.fgColor)) return true;
  if (checkColor(style.bgColor)) return true;
  if (checkColor(style.patternColor)) return true;
  
  return false;
}

export default async function handler(req, res) {
  // CORS headers
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
    console.log('Body size:', JSON.stringify(req.body).length);
    
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      console.error('❌ Missing parameters');
      return res.status(400).json({ 
        success: false,
        error: 'fileName ve fileData gerekli' 
      });
    }

    console.log(`📄 File: ${fileName}`);
    console.log(`📦 Data length: ${fileData.length}`);

    const tableName = extractTableName(fileName);
    if (!tableName) {
      return res.status(400).json({ 
        success: false,
        error: `Tablo adı çıkarılamadı. Format: XX_TABLENAME_YYYY.xlsx (Dosya: ${fileName})` 
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 File: ${fileName}`);
    console.log(`📋 Table: ${tableName}`);
    console.log(`${'='.repeat(60)}`);

    const buffer = Buffer.from(fileData, 'base64');
    const workbook = XLSX.read(buffer, { 
      cellFormula: false, 
      cellStyles: true,
      cellDates: true,
      cellNF: true
    });

    console.log(`📚 Sheets: ${workbook.SheetNames.join(', ')}`);

    let sheetName = workbook.SheetNames[0];
    if (workbook.SheetNames.includes('HI-HC')) {
      sheetName = 'HI-HC';
    }

    console.log(`📋 Using: ${sheetName}`);

    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    console.log(`📊 Range: ${worksheet['!ref']}`);

    const tarifeColumns = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
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
      console.log('First row values:', (() => {
        const vals = [];
        for (let col = 0; col <= Math.min(range.e.c, 20); col++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
          vals.push(cell ? cell.v : null);
        }
        return vals;
      })());
      
      return res.status(400).json({ 
        success: false,
        error: 'T01, T02... sütunları bulunamadı',
        firstRow: (() => {
          const vals = [];
          for (let col = 0; col <= Math.min(range.e.c, 20); col++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
            vals.push(cell ? cell.v : null);
          }
          return vals;
        })()
      });
    }

    console.log(`🚌 Tarifeler: ${tarifeColumns.map(t => `${t.name}(${t.colLetter})`).join(', ')}`);

    const dataToInsert = [];
    let yellowCount = 0;

    for (let row = 1; row <= range.e.r; row++) {
      for (const tarife of tarifeColumns) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: tarife.colIndex });
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v) {
          const isYellow = isYellowCell(cell);
          
          if (isYellow) {
            yellowCount++;
            
            let timeValue = String(cell.v).trim();
            
            if (typeof cell.v === 'number' && cell.v > 0 && cell.v < 1) {
              const totalSeconds = Math.round(cell.v * 86400);
              const hours = Math.floor(totalSeconds / 3600);
              const minutes = Math.floor((totalSeconds % 3600) / 60);
              timeValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
            } else if (timeValue.match(/^\d{1,2}:\d{2}$/)) {
              timeValue = `${timeValue}:00`;
            } else if (!timeValue.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
              console.warn(`⚠️ Invalid: ${cellAddress}: "${timeValue}"`);
              continue;
            }
            
            dataToInsert.push({
              Tarife: tarife.name,
              Tarife_Saati: timeValue,
              Onaylanan: null,
              Durum: null,
              Plaka: null
            });

            console.log(`✅ ${cellAddress} (${tarife.name}): ${timeValue}`);
          }
        }
      }
    }

    console.log(`\n📊 Yellow cells: ${yellowCount}, Valid: ${dataToInsert.length}`);

    if (dataToInsert.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Sarı hücre bulunamadı. Lütfen hücreleri Fill Color ile sarıya boyayın.',
        debug: {
          yellowFound: yellowCount,
          suggestion: 'Excel → Home → Fill Color → Yellow'
        }
      });
    }

    console.log(`🔧 Creating table: ${tableName}`);
    
    const createSQL = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        "Tarife" TEXT NOT NULL,
        "Tarife_Saati" TIME NOT NULL,
        "Onaylanan" TIME,
        "Durum" TEXT,
        "Plaka" TEXT,
        PRIMARY KEY ("Tarife_Saati")
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createSQL
    });

    if (createError) {
      console.error('❌ Create error:', createError);
      return res.status(500).json({ 
        success: false,
        error: 'Tablo oluşturulamadı: ' + createError.message,
        hint: 'Supabase SQL Editor\'de exec_sql fonksiyonunu oluşturun'
      });
    }

    console.log(`✅ Table OK`);

    console.log(`🗑️ Clearing old data...`);
    await supabase.from(tableName).delete().neq('Tarife', '___IMPOSSIBLE___');

    console.log(`📥 Inserting ${dataToInsert.length} records...`);
    
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

// Vercel serverless function config
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    },
    responseLimit: '50mb'
  }
};
