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
    const fill = cell.fill;
    const font = cell.font;
    
    if (!fill || !font) return false;
    
    // Fill rengini al
    let fillColor = null;
    if (fill.type === 'pattern' && fill.fgColor) {
      fillColor = fill.fgColor.argb;
    } else if (fill.bgColor) {
      fillColor = fill.bgColor.argb;
    }
    
    // Font rengini al
    let fontColor = null;
    if (font.color && font.color.argb) {
      fontColor = font.color.argb;
    }
    
    // Her iki renk de varsa karşılaştır
    if (fillColor && fontColor) {
      // ARGB formatı: FF000000 (8 karakter)
      // Son 6 karakteri karşılaştır (RGB)
      const fillRGB = fillColor.slice(-6).toUpperCase();
      const fontRGB = fontColor.slice(-6).toUpperCase();
      
      if (fillRGB === fontRGB) {
        return true;
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
      "Tarife" text NOT NULL,
      "Tarife_Saati" time without time zone NOT NULL,
      "Onaylanan" time without time zone NULL,
      "Durum" text NULL,
      "Plaka" text NULL,
      "Hareket" text NULL,
      CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("Tarife_Saati")
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
    ON CONFLICT ("Tarife_Saati") 
    DO UPDATE SET
      "Tarife" = EXCLUDED."Tarife",
      "Onaylanan" = EXCLUDED."Onaylanan",
      "Durum" = EXCLUDED."Durum",
      "Plaka" = EXCLUDED."Plaka",
      "Hareket" = EXCLUDED."Hareket";
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
    // ExcelJS: satır 5 (row index 5), D sütunundan (col 4) başla
    const headerRow = worksheet.getRow(5);
    for (let col = 4; col <= 30; col++) {
      const cell = headerRow.getCell(col);
      if (!cell || !cell.value) break;
      const headerValue = String(cell.value).trim();
      if (headerValue.match(/^T\d{2}$/)) {
        tarifeColumns.push({ col, name: headerValue });
      }
    }

    if (tarifeColumns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'T01, T02... sütunları bulunamadı'
      });
    }

    const hareketRows = [];
    // ExcelJS: B sütunu (col 2), satır 7'den başla
    for (let rowNum = 7; rowNum <= 50; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const cell = row.getCell(2); // B sütunu
      if (!cell || !cell.value) continue;
      
      const hareketValue = String(cell.value).trim();
      if (hareketValue === 'Kalkış' || hareketValue === 'Dönüş') {
        hareketRows.push({ rowNum, hareket: hareketValue });
      }
    }

    if (hareketRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Kalkış/Dönüş satırları bulunamadı'
      });
    }

    const dataToInsert = [];
    for (const hareketRow of hareketRows) {
      for (const tarife of tarifeColumns) {
        const row = worksheet.getRow(hareketRow.rowNum);
        const cell = row.getCell(tarife.col);
        
        if (!cell || !cell.value) continue;
        
        // Hücre değeri sadece whitespace ise atla
        const cellValueStr = String(cell.value).trim();
        if (!cellValueStr) continue;
        
        // Formül içeren hücreleri atla
        if (cell.formula) continue;
        
        // Hücre rengi ve yazı rengi aynıysa atla (gizli veri)
        if (isCellHidden(cell)) continue;
        
        const timeValue = formatTime(cell.value);
        if (!timeValue) continue;

        dataToInsert.push({
          Hareket: hareketRow.hareket,
          Tarife: tarife.name,
          Tarife_Saati: timeValue,
          Onaylanan: null,
          Durum: null,
          Plaka: null
        });
      }
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