import XLSX from 'xlsx';
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

function isCellHidden(cell, workbook) {
  if (!cell || !cell.s) return false;
  
  const style = workbook.Styles?.[cell.s];
  if (!style) return false;
  
  // Hücre fill rengi ve font rengi karşılaştır
  const fillColor = style.fill?.fgColor?.rgb || style.fill?.bgColor?.rgb;
  const fontColor = style.font?.color?.rgb;
  
  // Eğer her iki renk de varsa ve aynıysa, gizli sayılır
  if (fillColor && fontColor && fillColor === fontColor) {
    return true;
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
    const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: false, cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const tableName = extractTableName(fileName);
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Dosya adı XX_TABLENAME_YYYY_MM_DD.xlsx formatında olmalı'
      });
    }

    const tarifeColumns = [];
    for (let col = 3; col < 30; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col });
      const cell = sheet[cellAddress];
      if (!cell || !cell.v) break;
      const headerValue = String(cell.v).trim();
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
    for (let row = 6; row < 50; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 1 });
      const cell = sheet[cellAddress];
      if (!cell || !cell.v) continue;
      
      const hareketValue = String(cell.v).trim();
      if (hareketValue === 'Kalkış' || hareketValue === 'Dönüş') {
        hareketRows.push({ row, hareket: hareketValue });
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
        const cellAddress = XLSX.utils.encode_cell({ r: hareketRow.row, c: tarife.col });
        const cell = sheet[cellAddress];
        
        if (!cell || !cell.v) continue;
        
        // Hücre rengi ve yazı rengi aynıysa atla (gizli veri)
        if (isCellHidden(cell, workbook)) continue;
        
        const timeValue = formatTime(cell.v);
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