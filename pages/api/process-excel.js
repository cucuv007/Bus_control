import ExcelJS from 'exceljs';
import { Pool } from 'pg';

// PostgreSQL bağlantı havuzu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

function extractTableName(filename) {
  const cleaned = filename.replace(/\.(xlsx|xls)$/i, '');
  const parts = cleaned.split('_');
  if (parts.length >= 2) return parts[1];
  return null;
}

function formatTime(value) {
  if (!value && value !== 0) return null;
  
  // ExcelJS Date object ise
  if (value instanceof Date) {
    const hours = value.getHours();
    const minutes = value.getMinutes();
    const seconds = value.getSeconds();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  const valueStr = String(value).trim();
  
  if (valueStr.startsWith('=')) return null;
  
  if (typeof value === 'number' && value >= 0 && value < 1) {
    const totalSeconds = Math.round(value * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  
  if (valueStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) return valueStr;
  if (valueStr.match(/^\d{1,2}:\d{2}$/)) return `${valueStr}:00`;
  
  return valueStr;
}

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
        return true; // Beyaz yazı - atla
      }
    }
    
    // Theme-based beyaz kontrolü
    if (font.color.theme !== undefined) {
      const theme = font.color.theme;
      const tint = font.color.tint || 0;
      
      // DEBUG: Gerçek tema değerlerini görelim (comment out after testing)
      console.log(`DEBUG Font - Theme: ${theme}, Tint: ${tint.toFixed(2)}, Cell: ${cell.address}`);
      
      // Tema 0 genellikle BEYAZ (light1/background)
      // Tema 1 genellikle SİYAH/KOYU (dark1/text)
      // Tint: pozitif = daha açık, negatif = daha koyu
      if (theme === 0 && tint >= 0) {
        return true; // Beyaz tema - atla
      }
    }
    
  } catch (err) {
    console.error('Cell hidden check error:', err);
  }
  
  return false;
}

async function createTableIfNotExists(client, tableName) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public."${tableName}" (
      "id" SERIAL PRIMARY KEY,
      "Tarife" text NOT NULL,
      "Tarife_Saati" time without time zone NOT NULL,
      "Onaylanan" time without time zone NULL,
      "Durum" text NULL,
      "Plaka" text NULL,
      "Hareket" text NULL,
      CONSTRAINT "${tableName}_unique_time_hareket" UNIQUE ("Tarife_Saati", "Hareket")
    );
    
    ALTER TABLE public."${tableName}" DISABLE ROW LEVEL SECURITY;
  `;
  
  try {
    await client.query(createTableSQL);

    // Realtime için publication ekleme/oluşturma
    try {
      // Önce publication oluşturmaya çalış
      await client.query(`CREATE PUBLICATION supabase_realtime FOR TABLE public."${tableName}";`);
    } catch (pubErr) {
      // Eğer publication zaten varsa, tabloyu eklemeyi dene
      try {
        await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public."${tableName}";`);
      } catch (alterErr) {
        // Eğer tablo zaten ekliyse veya başka bir hata varsa logla ama devam et
        if (!/already|duplicate|exists/i.test(String(alterErr.message))) {
          console.error('Publication alter error:', alterErr);
        }
      }
    }

    return { success: true, created: true, message: `Tablo "${tableName}" başarıyla oluşturuldu ve realtime etkinleştirildi` };
  } catch (err) {
    if (err.message.includes('already exists')) {
      // Publication tarafında ayrıca tabloyu publication'a ekmeyi dene, çünkü tablo zaten varsa oluşturma atladı
      try {
        await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public."${tableName}";`);
        return { success: true, created: false, message: `Tablo "${tableName}" zaten var. Realtime etkinleştirildi (varsa).` };
      } catch (alterErr) {
        if (!/already|duplicate|exists/i.test(String(alterErr.message))) {
          console.error('Publication alter error on existing table:', alterErr);
        }
        return { success: true, created: false, message: `Tablo "${tableName}" zaten var` };
      }
    }
    console.error('Table creation error:', err);
    return { success: false, created: false, message: `Tablo oluşturma başarısız: ${err.message}` };
  }
}

async function upsertData(client, tableName, dataToInsert) {
  const query = `
    INSERT INTO public."${tableName}" ("Tarife", "Tarife_Saati", "Onaylanan", "Durum", "Plaka", "Hareket")
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT ("Tarife_Saati", "Hareket") 
    DO UPDATE SET
      "Tarife" = EXCLUDED."Tarife",
      "Onaylanan" = EXCLUDED."Onaylanan",
      "Durum" = EXCLUDED."Durum",
      "Plaka" = EXCLUDED."Plaka";
  `;
  
  let insertedCount = 0;
  for (const row of dataToInsert) {
    try {
      await client.query(query, [
        row.Tarife,
        row.Tarife_Saati,
        row.Onaylanan || null,
        row.Durum || null,
        row.Plaka || null,
        row.Hareket
      ]);
      insertedCount++;
    } catch (err) {
      console.error('Row insert error:', err, row);
    }
  }
  
  return insertedCount;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'fileName ve fileData gerekli'
      });
    }

    // PostgreSQL client'ı al
    client = await pool.connect();

    const buffer = Buffer.from(fileData, 'base64');
    
    // ExcelJS ile workbook oku
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.worksheets[0];
    const sheetName = worksheet.name;

    const tableName = extractTableName(fileName);
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Dosya adı XX_TABLENAME_YYYY_MM_DD.xlsx formatında olmalı'
      });
    }

    const tarifeColumns = [];
    // ExcelJS: İlk 20 satırda T01, T02... başlıklarını ara
    let foundHeaderRow = null;
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
      
      // En az 1 tarife başlığı bulduysa bu satırı kullan
      if (tempCols.length > 0) {
        tarifeColumns.push(...tempCols);
        foundHeaderRow = rowNum;
        break;
      }
    }

    if (tarifeColumns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'T01, T02... sütunları bulunamadı'
      });
    }

    const hareketRows = [];
    // ExcelJS: B sütunu (col 2), foundHeaderRow+2'den başla (foundHeaderRow+1 genelde boş)
    const startRowForHareket = foundHeaderRow + 2;
    console.log(`=== Hareket Satırları Taranıyor (Satır ${startRowForHareket}+) ===`);
    
    let foundFirstHareket = false; // İlk Kalkış/Dönüş bulundu mu?
    
    for (let rowNum = startRowForHareket; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const cell = row.getCell(2); // B sütunu
      
      // Merged cell kontrolü - SADECE en az 1 hareket bulduktan SONRA
      if (foundFirstHareket && cell.isMerged) {
        console.log(`Merged cell tespit edildi - tarama tamamlandı (${hareketRows.length} hareket bulundu)`);
        break;
      }
      
      if (!cell || !cell.value) continue;
      
      const hareketValue = String(cell.value).trim();
      
      if (hareketValue === 'Kalkış' || hareketValue === 'Dönüş') {
        console.log(`  ✓ ${hareketValue} bulundu (Satır ${rowNum})`);
        hareketRows.push({ rowNum, hareket: hareketValue });
        foundFirstHareket = true; // İlk hareket bulundu, artık merged cell kontrolü aktif
      }
    }
    console.log(`=== Toplam ${hareketRows.length} hareket satırı tespit edildi ===`);

    if (hareketRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Kalkış/Dönüş satırları bulunamadı'
      });
    }

    const dataToInsert = [];
    console.log(`=== Veri Parse Başladı (${hareketRows.length} hareket satırı x ${tarifeColumns.length} tarife sütunu) ===`);
    for (const hareketRow of hareketRows) {
      console.log(`\n--- ${hareketRow.hareket} (Satır ${hareketRow.rowNum}) ---`);
      let addedCount = 0;
      let skippedCount = 0;
      
      for (const tarife of tarifeColumns) {
        const row = worksheet.getRow(hareketRow.rowNum);
        const cell = row.getCell(tarife.col);
        
        if (!cell || !cell.value) continue;
        
        // Hücre rengi ve yazı rengi aynıysa atla (gizli veri veya beyaz yazı)
        if (isCellHidden(cell)) {
          skippedCount++;
          continue;
        }
        
        // Formül hücrelerinde hesaplanmış değeri kullan
        let cellValue = cell.value;
        if (cell.formula) {
          // ExcelJS'de formül hücresinin değeri şu formatta olabilir:
          // { formula: '=D8+$C$7', result: 0.275 } veya direkt sonuç
          if (typeof cell.value === 'object' && cell.value.result !== undefined) {
            cellValue = cell.value.result;
          }
        }
        
        const timeValue = formatTime(cellValue);
        if (!timeValue) continue;

        dataToInsert.push({
          Hareket: hareketRow.hareket,
          Tarife: tarife.name,
          Tarife_Saati: timeValue,
          Onaylanan: null,
          Durum: null,
          Plaka: null
        });
        addedCount++;
      }
      console.log(`  ✅ ${addedCount} kayıt eklendi${skippedCount > 0 ? ` | ${skippedCount} beyaz/gizli hücre atlandı` : ''}`);
    }

    if (dataToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Veri parse edilemedi'
      });
    }

    // Tablo oluştur (yoksa)
    const tableCreation = await createTableIfNotExists(client, tableName);
    if (!tableCreation.success) {
      return res.status(500).json({
        success: false,
        error: tableCreation.message
      });
    }

    // Veri ekle (upsert)
    const insertedCount = await upsertData(client, tableName, dataToInsert);

    return res.status(200).json({
      success: true,
      tableName,
      sheetName,
      inserted: insertedCount,
      message: `${insertedCount} sefer eklendi`,
      tarifeColumns: tarifeColumns.map(t => t.name)
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' }, responseLimit: '50mb' }
};