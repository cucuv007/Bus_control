// pages/api/process-plaka-excel.js
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GUNLER = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];

async function upsertPlakaData(tableName, dataToInsert) {
  let insertedCount = 0;
  
  for (const row of dataToInsert) {
    try {
      // Supabase upsert - duplicate varsa update, yoksa insert
      const { error } = await supabase
        .from(tableName)
        .upsert(
          {
            Plaka: row.Plaka || null,
            Hat_Adi: row.Hat_Adi || null,
            Tarife: row.Tarife || null
          },
          { 
            onConflict: 'Plaka,Hat_Adi,Tarife'
          }
        );
      
      if (error) {
        console.error('Row insert error:', error.message, row);
        // İlk hata tablo yoksa olabilir, devam et
      } else {
        insertedCount++;
      }
    } catch (err) {
      console.error('Row insert exception:', err.message, row);
    }
  }
  
  return insertedCount;
}

export default async function handler(req, res) {
  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'fileName ve fileData gerekli'
      });
    }

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

      console.log(`📝 "${sheetName}" için ${dataToInsert.length} kayıt bulundu, ekleniyor...`);

      // Veri ekle (tablo yoksa Supabase'de manuel oluşturulmalı)
      const insertedCount = await upsertPlakaData(sheetName, dataToInsert);
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
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};
