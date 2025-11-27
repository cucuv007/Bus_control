// pages/api/process-plaka-excel.js
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GUNLER = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];

async function clearAndInsertPlakaData(tableName, dataToInsert, shouldClearTable) {
  try {
    // 1. Eğer shouldClearTable true ise TÜM verileri sil
    if (shouldClearTable) {
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
          .not('Plaka', 'is', null);
        
        if (deleteError) {
          throw new Error(`Eski veriler silinemedi: ${deleteError.message}`);
        }
      }
      
      console.log(`✅ Tablo temizlendi (ID sequence resetlendi)`);
    } else {
      console.log(`ℹ️ "${tableName}" tablosu temizlenmeyecek (Belediye dosyası - ekleme modu)`);
    }
    
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

// Tarihten gün ismini bul (Türkçe)
function getGunFromDate(dateString) {
  try {
    // Tarih formatı: DD.MM.YYYY veya DD/MM/YYYY
    const parts = dateString.split(/[./]/);
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript ayları 0-11 arası
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    const gunIndex = date.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    
    const gunler = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
    return gunler[gunIndex];
  } catch (err) {
    console.error('Tarih parse hatası:', err);
    return null;
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

    // Belediye dosyası kontrolü
    const isBelediyeFile = fileName.toUpperCase().includes('BELEDİYE');
    console.log(`\n=== 📊 Plaka Excel Dosyası: ${fileName} ===`);
    console.log(`=== 📋 Dosya Tipi: ${isBelediyeFile ? '🏛️ BELEDİYE (Ekleme Modu)' : '🔄 NORMAL (Silip Yükleme Modu)'} ===\n`);

    const buffer = Buffer.from(fileData, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    console.log(`=== 📋 Toplam ${workbook.worksheets.length} sayfa bulundu ===\n`);

    const processedTables = [];

    // Belediye dosyası ise: "Düzenle" sayfasını bul ve tarihten günü tespit et
    if (isBelediyeFile) {
      console.log('🔍 Belediye dosyası algılandı, "Düzenle" sayfası aranıyor...');
      
      const duzenleSheet = workbook.worksheets.find(ws => 
        ws.name.toUpperCase().trim() === 'DÜZENLE'
      );
      
      if (!duzenleSheet) {
        return res.status(400).json({
          success: false,
          error: 'Belediye dosyasında "Düzenle" sayfası bulunamadı'
        });
      }
      
      console.log('✅ "Düzenle" sayfası bulundu');
      
      // Dosya adından tarihi çıkar (örn: "Belediye_26.11.2025 ULAŞIM - Şablon.xlsm")
      const dateMatch = fileName.match(/(\d{2}[./]\d{2}[./]\d{4})/);
      if (!dateMatch) {
        return res.status(400).json({
          success: false,
          error: 'Belediye dosyası adında tarih bulunamadı (DD.MM.YYYY veya DD/MM/YYYY formatında olmalı)'
        });
      }
      
      const dateString = dateMatch[1];
      const gunAdi = getGunFromDate(dateString);
      
      if (!gunAdi) {
        return res.status(400).json({
          success: false,
          error: `Tarih geçersiz: ${dateString}`
        });
      }
      
      console.log(`📅 Dosya tarihi: ${dateString} → Gün: ${gunAdi}`);
      
      const dataToInsert = [];
      
      // "Düzenle" sayfasından verileri oku
      for (let rowNum = 1; rowNum <= duzenleSheet.rowCount; rowNum++) {
        const row = duzenleSheet.getRow(rowNum);
        
        const plakaCell = row.getCell(1); // A
        const hatAdiCell = row.getCell(2); // B
        const tarifeCell = row.getCell(3); // C

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
        return res.status(400).json({
          success: false,
          error: '"Düzenle" sayfasında veri bulunamadı'
        });
      }
      
      console.log(`📝 "${gunAdi}" tablosuna ${dataToInsert.length} kayıt eklenecek (mevcut veriler korunacak)`);
      
      // Mevcut verileri koruyarak ekle (shouldClearTable = false)
      const insertedCount = await clearAndInsertPlakaData(gunAdi, dataToInsert, false);
      
      processedTables.push({
        tableName: gunAdi,
        recordCount: insertedCount,
        mode: 'EKLEME'
      });
      
    } else {
      // Normal dosya: Tüm gün sayfalarını işle ve eski verileri sil
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

        // Satır 1'den başlayarak TÜM satırları oku
        for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
          const row = worksheet.getRow(rowNum);
          
          const plakaCell = row.getCell(1); // A
          const hatAdiCell = row.getCell(2); // B
          const tarifeCell = row.getCell(3); // C

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

        // Eski verileri sil ve yeni verileri ekle (shouldClearTable = true)
        const insertedCount = await clearAndInsertPlakaData(sheetName, dataToInsert, true);

        processedTables.push({
          tableName: sheetName,
          recordCount: insertedCount,
          mode: 'YENİLEME'
        });
      }
    }

    if (processedTables.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hiçbir tablo işlenemedi'
      });
    }

    console.log(`\n✅ Toplam ${processedTables.length} tablo güncellendi\n`);

    return res.status(200).json({
      success: true,
      processedTables: processedTables,
      fileType: isBelediyeFile ? 'BELEDİYE' : 'NORMAL',
      message: isBelediyeFile 
        ? `Belediye dosyası eklendi (mevcut veriler korundu)`
        : `${processedTables.length} gün tablosu güncellendi (eski veriler silindi)`
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
