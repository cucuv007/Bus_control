// pages/api/process-excel.js
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Dosya adından tablo adını çıkar
// Örn: "13_VL13_2025_10_13.xlsx" → "VL13"
function extractTableName(filename) {
  const parts = filename.replace('.xlsx', '').replace('.xls', '').split('_');
  if (parts.length >= 2) {
    return parts[1]; // İkinci _ arasındaki kısım
  }
  return null;
}

// Renk kontrolü: Sarı mı?
function isYellowColor(fill) {
  if (!fill || !fill.fgColor) return false;
  
  const color = fill.fgColor;
  
  // RGB değerleri: Sarı = R:1, G:1, B:0 (veya yakın değerler)
  if (color.rgb) {
    const rgb = color.rgb.toLowerCase();
    // FFFF00 = Sarı, FFFFFF00 = Sarı (alpha ile)
    return rgb === 'ffffff00' || rgb === 'ffff00' || rgb.endsWith('ffff00');
  }
  
  // Theme rengi ise
  if (color.theme !== undefined) {
    // Theme 3 = Accent1 (genelde sarı)
    return color.theme === 3;
  }
  
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'File name ve data gerekli' });
    }

    // Tablo adını çıkar
    const tableName = extractTableName(fileName);
    if (!tableName) {
      return res.status(400).json({ 
        error: 'Dosya adından tablo adı çıkarılamadı. Format: XX_TABLENAME_YYYY_MM_DD.xlsx' 
      });
    }

    console.log(`\n📄 Processing: ${fileName} → Table: ${tableName}`);

    // Excel dosyasını parse et
    const buffer = Buffer.from(fileData, 'base64');
    const workbook = XLSX.read(buffer, { cellFormula: false, cellStyles: true });

    // Sheet seç: "HI-HC" varsa onu, yoksa ilk sheet'i
    let sheetName = workbook.SheetNames[0];
    if (workbook.SheetNames.includes('HI-HC')) {
      sheetName = 'HI-HC';
    }

    console.log(`📋 Using sheet: ${sheetName}`);

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel dosyası boş' });
    }

    // D sütunundan T01, T02... bulma
    const tarifeColumns = [];
    const firstRow = data[0] || [];

    console.log(`📊 First row (D sütunundan): ${firstRow.slice(3, 10).join(', ')}`);

    for (let col = 3; col < firstRow.length; col++) { // D = 3 (0-indexed)
      const cellValue = firstRow[col];
      if (cellValue && cellValue.toString().match(/^T\d+$/)) {
        tarifeColumns.push({
          name: cellValue.toString().trim(),
          colIndex: col
        });
      } else if (tarifeColumns.length > 0) {
        break;
      }
    }

    if (tarifeColumns.length === 0) {
      return res.status(400).json({ 
        error: 'T01, T02... formatında tarife bulunamadı',
        firstRow: firstRow.slice(3, 10)
      });
    }

    console.log(`🚌 Bulunan tarifeler: ${tarifeColumns.map(t => t.name).join(', ')}`);

    // Sarı renkli hücreleri bul
    const dataToInsert = [];

    // Tüm hücreleri kontrol et
    for (let row = 1; row < data.length; row++) {
      for (const tarife of tarifeColumns) {
        const colIndex = tarife.colIndex;
        const cellRef = XLSX.utils.encode_cell({ r: row, c: colIndex });
        const cell = worksheet[cellRef];

        if (cell && cell.v) {
          // Hücrenin sarı renkli olup olmadığını kontrol et
          const isYellow = cell.s && isYellowColor(cell.s.fill);

          if (isYellow) {
            const timeValue = cell.v.toString().trim();
            
            // Zaman formatını kontrol et (HH:MM veya HH:MM:SS)
            if (timeValue.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
              dataToInsert.push({
                Tarife: tarife.name,
                Tarife_Saati: timeValue.length === 5 ? timeValue + ':00' : timeValue,
                Onaylanan: null,
                Durum: null,
                Plaka: null
              });

              console.log(`  ✅ [${tarife.name}] Row ${row + 1}: "${timeValue}" - SARIYA İŞARETLENMİŞ`);
            }
          }
        }
      }
    }

    if (dataToInsert.length === 0) {
      return res.status(400).json({ 
        error: 'Sarı renkli hücre bulunamadı',
        debug: 'Lütfen hücreleri sarı renkle boyayıp tekrar deneyin'
      });
    }

    console.log(`📥 Eklenecek ${dataToInsert.length} veri bulundu\n`);

    // Tablo oluştur - Supabase'e insert et, otomatik oluşsun
    const { error: insertError, data: insertedData } = await supabase
      .from(tableName)
      .insert(dataToInsert);

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ 
        error: 'Veri eklenemedi: ' + insertError.message 
      });
    }

    return res.status(200).json({
      success: true,
      tableName: tableName,
      sheetName: sheetName,
      message: `${dataToInsert.length} sefer başarıyla eklendi`,
      inserted: dataToInsert.length,
      data: dataToInsert
    });

  } catch (err) {
    console.error('Process excel error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
