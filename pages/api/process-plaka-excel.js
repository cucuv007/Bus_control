// pages/api/process-plaka-excel.js
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GUNLER = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];

async function clearAndInsertPlakaData(tableName, dataToInsert) {
  try {
    // 1. Önce tablodaki tüm verileri sil
    console.log(`🗑️ "${tableName}" tablosundaki eski veriler siliniyor...`);
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', 0); // Tüm satırları sil (id != 0 her zaman true)
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw new Error(`Eski veriler silinemedi: ${deleteError.message}`);
    }
    
    console.log(`✅ Eski veriler silindi`);
    
    // 2. Yeni verileri ekle
    console.log(`📝 ${dataToInsert.length} yeni kayıt ekleniyor...`);
    
    // Toplu insert (batch) - daha hızlı
    const { data, error: insertError } = await supabase
      .from(tableName)
      .insert(dataToInsert);
    
    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Yeni veriler eklenemedi: ${insertError.message}`);
    }
    
    console.log(`✅ ${dataToInsert.length} kayıt eklendi`);
    return dataToInsert.length;
    
  } catch (err) {
    console.error('clearAndInsertPlakaData error:', err);
    throw err;
  }
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

      // Satır 1'den başlayarak TÜM satırları oku (header yok, her satır veri)
      for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        
        // A sütunu = Plaka, B sütunu = Hat_Adi, C sütunu = Tarife
        const plakaCell = row.getCell(1); // A
        const hatAdiCell = row.getCell(2); // B
        const tarifeCell = row.getCell(3); // C

        // Plaka boşsa satırı atla
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

      console.log(`📝 "${sheetName}" için ${dataToInsert.length} kayıt bulundu`);

      // Eski verileri sil ve yeni verileri ekle
      const insertedCount = await clearAndInsertPlakaData(sheetName, dataToInsert);

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

    console.log(`\n✅ Toplam ${processedTables.length} tablo güncellendi\n`);

    return res.status(200).json({
      success: true,
      processedTables: processedTables,
      message: `${processedTables.length} gün tablosu güncellendi (eski veriler silindi, yeni veriler eklendi)`
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
