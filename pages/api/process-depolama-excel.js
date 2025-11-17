// pages/api/process-depolama-excel.js
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Depolama tabloları listesi
const DEPOLAMA_TABLES = [
  'AKSU', 'MEYDAN', 'VARSAK ALTIAYAK', 'OTOGAR', 'VARSAK AKTARMA', 
  'ÜNSAL', 'SARISU', 'GÜRSU', 'ORGANİZE SANAYİ', 'TRT KAMPI', 
  'VARSAK', 'GÜZELOBA', 'KURŞUNLU ŞELALESİ', 'TERMİNAL', 
  'AKDENİZ ÜNİVERSİTESİ', 'KEPEZ KAYMAKAMLIĞI', 'VARSAK BELEDİYE', 
  'DEEPO AVM', 'ŞEHİR HASTANESİ', 'ANTOBÜS'
];

async function clearAndInsertDepolama(tableName, dataToInsert) {
  try {
    console.log(`🗑️ "${tableName}" tablosu temizleniyor (ID resetlenecek)...`);
    
    // TRUNCATE: Hem verileri siler, hem de SERIAL sequence'i 1'e resetler
    const { error: truncateError } = await supabase.rpc('truncate_table', {
      table_name: tableName
    });
    
    if (truncateError) {
      console.error('Truncate error:', truncateError);
      // Eğer TRUNCATE RPC yoksa, DELETE kullan (eski yöntem)
      console.log('⚠️ TRUNCATE başarısız, DELETE kullanılıyor...');
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .not('id', 'is', null);
      
      if (deleteError) {
        throw new Error(`Eski veriler silinemedi: ${deleteError.message}`);
      }
    }
    
    console.log(`✅ Tablo temizlendi (ID sequence resetlendi)`);
    
    // Yeni verileri ekle
    console.log(`📝 ${dataToInsert.length} yeni kayıt ekleniyor...`);
    
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
    console.error('clearAndInsertDepolama error:', err);
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

    console.log(`\n=== 📊 Depolama Excel Dosyası: ${fileName} ===`);

    // İlk sayfayı al
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        error: 'Excel dosyasında sayfa bulunamadı'
      });
    }

    console.log(`\n🔍 Sayfa işleniyor: "${worksheet.name}"`);

    // Depolama verilerini topla
    const depolamaData = {};
    
    // Her depolama tablosu için boş array oluştur
    DEPOLAMA_TABLES.forEach(table => {
      depolamaData[table] = [];
    });

    // Satırları oku (1'den başla, header yok varsayıyoruz)
    for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      // A sütunu = Hat_Adi, D sütunu = Depolama
      const hatAdiCell = row.getCell(1); // A
      const depolamaCell = row.getCell(4); // D

      // Her iki hücre de dolu olmalı
      if (!hatAdiCell || !hatAdiCell.value || !depolamaCell || !depolamaCell.value) {
        continue;
      }

      const hatAdi = String(hatAdiCell.value).trim();
      const depolamaValue = String(depolamaCell.value).trim().toUpperCase();

      // Depolama değeri tablolarımızdan birinde mi?
      if (DEPOLAMA_TABLES.includes(depolamaValue)) {
        depolamaData[depolamaValue].push({
          Hat_Adi: hatAdi,
          Depolama: depolamaValue
        });
      }
    }

    console.log(`\n📊 Bulunan veriler:`);
    
    const processedTables = [];
    let totalInserted = 0;

    // Her depolama tablosu için verileri ekle
    for (const tableName of DEPOLAMA_TABLES) {
      const dataToInsert = depolamaData[tableName];
      
      if (dataToInsert.length === 0) {
        console.log(`⏭️ "${tableName}" için veri bulunamadı, atlandı`);
        continue;
      }

      console.log(`📝 "${tableName}" için ${dataToInsert.length} kayıt bulundu`);

      // Eski verileri sil ve yeni verileri ekle
      const insertedCount = await clearAndInsertDepolama(tableName, dataToInsert);
      
      totalInserted += insertedCount;

      processedTables.push({
        tableName: tableName,
        recordCount: insertedCount
      });
    }

    if (processedTables.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hiçbir depolama tablosu için veri bulunamadı. D sütununda geçerli depolama isimleri var mı kontrol edin.'
      });
    }

    console.log(`\n✅ Toplam ${processedTables.length} depolama tablosu güncellendi`);
    console.log(`✅ Toplam ${totalInserted} kayıt eklendi\n`);

    return res.status(200).json({
      success: true,
      processedTables: processedTables,
      totalRecords: totalInserted,
      message: `${processedTables.length} depolama tablosu güncellendi (${totalInserted} kayıt)`
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
