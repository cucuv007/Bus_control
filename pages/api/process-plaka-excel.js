// pages/api/process-plaka-excel.js
import ExcelJS from 'exceljs';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '6543'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const GUNLER = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];

async function createPlakaTableIfNotExists(client, tableName) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public."${tableName}" (
      "id" SERIAL PRIMARY KEY,
      "Plaka" text NOT NULL,
      "Hat_Adi" text NULL,
      "Tarife" text NULL,
      CONSTRAINT "${tableName}_unique_plaka_hat_tarife" UNIQUE ("Plaka", "Hat_Adi", "Tarife")
    );
    
    ALTER TABLE public."${tableName}" DISABLE ROW LEVEL SECURITY;
  `;
  
  try {
    await client.query(createTableSQL);
    return { success: true };
  } catch (err) {
    console.error('Table creation error:', err);
    return { success: false, message: err.message };
  }
}

async function upsertPlakaData(client, tableName, dataToInsert) {
  const query = `
    INSERT INTO public."${tableName}" ("Plaka", "Hat_Adi", "Tarife")
    VALUES ($1, $2, $3)
    ON CONFLICT ("Plaka", "Hat_Adi", "Tarife") 
    DO UPDATE SET
      "Plaka" = EXCLUDED."Plaka",
      "Hat_Adi" = EXCLUDED."Hat_Adi",
      "Tarife" = EXCLUDED."Tarife";
  `;
  
  let insertedCount = 0;
  for (const row of dataToInsert) {
    try {
      await client.query(query, [
        row.Plaka || null,
        row.Hat_Adi || null,
        row.Tarife || null
      ]);
      insertedCount++;
    } catch (err) {
      console.error('Row insert error:', err, row);
    }
  }
  
  return insertedCount;
}

export default async function handler(req, res) {
  let client = null;

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'fileName ve fileData gerekli'
      });
    }

    client = await pool.connect();

    const buffer = Buffer.from(fileData, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    console.log(`\n=== 📊 Plaka Excel Dosyası: ${fileName} ===`);
    console.log(`=== 📋 Toplam ${workbook.worksheets.length} sayfa bulundu ===\n`);

    const processedTables = [];

    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name.toUpperCase().trim();

      // ROTASYON sayfasını atla
      if (sheetName === 'ROTASYON') {
        console.log(`⏭️ "${worksheet.name}" sayfası atlandı (ROTASYON)`);
        continue;
      }

      // Sadece gün isimlerini işle
      if (!GUNLER.includes(sheetName)) {
        console.log(`⏭️ "${worksheet.name}" sayfası atlandı (gün adı değil)`);
        continue;
      }

      console.log(`\n🔍 Sayfa işleniyor: "${sheetName}"`);

      const dataToInsert = [];

      // İlk satırdan başlayarak verileri oku
      for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        
        // Plaka (A sütunu), Hat_Adi (B sütunu), Tarife (C sütunu)
        const plakaCell = row.getCell(1);
        const hatAdiCell = row.getCell(2);
        const tarifeCell = row.getCell(3);

        if (!plakaCell || !plakaCell.value) continue;

        const plaka = String(plakaCell.value).trim();
        const hatAdi = hatAdiCell && hatAdiCell.value ? String(hatAdiCell.value).trim() : null;
        const tarife = tarifeCell && tarifeCell.value ? String(tarifeCell.value).trim() : null;

        if (plaka) {
          dataToInsert.push({
            Plaka: plaka,
            Hat_Adi: hatAdi,
            Tarife: tarife
          });
        }
      }

      if (dataToInsert.length === 0) {
        console.log(`⚠️ "${sheetName}" sayfasında veri bulunamadı`);
        continue;
      }

      // Tablo oluştur
      const tableCreation = await createPlakaTableIfNotExists(client, sheetName);
      if (!tableCreation.success) {
        console.error(`❌ "${sheetName}" tablosu oluşturulamadı: ${tableCreation.message}`);
        continue;
      }

      // Veri ekle
      const insertedCount = await upsertPlakaData(client, sheetName, dataToInsert);
      console.log(`✅ "${sheetName}" tablosuna ${insertedCount} kayıt eklendi`);

      processedTables.push({
        tableName: sheetName,
        recordCount: insertedCount
      });
    }

    if (processedTables.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hiçbir gün sayfası işlenemedi'
      });
    }

    return res.status(200).json({
      success: true,
      processedTables: processedTables,
      message: `${processedTables.length} gün tablosu oluşturuldu`
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
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};
