import ExcelJS from 'exceljs';
import { Pool } from 'pg';

// PostgreSQL bağlantı havuzu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000, // 30 saniye
  idleTimeoutMillis: 30000,
  max: 20 // Maksimum bağlantı sayısı
});

function extractTableName(filename) {
  const cleaned = filename.replace(/\.(xlsx|xls)$/i, '');
  const parts = cleaned.split('_');
  if (parts.length >= 2) {
    const tableNamePart = parts[1];
    // Eğer "-" varsa, birden fazla tablo var demektir
    if (tableNamePart.includes('-')) {
      return tableNamePart.split('-'); // ["MC12", "MC12A"]
    }
    return [tableNamePart]; // ["AC05"]
  }
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
      "Hat_Adi" text NULL,
      "Çalışma_Zamanı" text NULL,
      "Tarife" text NOT NULL,
      "Tarife_Saati" time without time zone NOT NULL,
      "Onaylanan" time without time zone NULL,
      "Durum" text NULL,
      "Plaka" text NULL,
      "Hareket" text NULL,
      CONSTRAINT "${tableName}_unique" UNIQUE ("Tarife", "Tarife_Saati", "Hareket", "Çalışma_Zamanı")
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

async function clearAndInsertData(client, tableName, dataToInsert) {
  try {
    // 1. Tüm verileri sil
    console.log(`🗑️ "${tableName}" tablosundaki eski veriler siliniyor...`);
    await client.query(`DELETE FROM public."${tableName}";`);
    console.log(`✅ Eski veriler silindi`);
    
    // 2. ID sequence'ini resetle (id 1'den başlasın)
    console.log(`🔄 "${tableName}" ID sequence resetleniyor...`);
    try {
      await client.query(`ALTER SEQUENCE "${tableName}_id_seq" RESTART WITH 1;`);
      console.log(`✅ ID sequence resetlendi`);
    } catch (seqErr) {
      console.warn(`⚠️ Sequence reset uyarısı:`, seqErr.message);
      // Hata olsa bile devam et (bazı tablolarda sequence farklı isimde olabilir)
    }
    
    // 3. Yeni verileri ekle (batch insert)
    console.log(`📝 ${dataToInsert.length} yeni kayıt ekleniyor...`);
    
    const insertQuery = `
      INSERT INTO public."${tableName}" ("Hat_Adi", "Çalışma_Zamanı", "Tarife", "Tarife_Saati", "Onaylanan", "Durum", "Plaka", "Hareket")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;
    
    let insertedCount = 0;
    for (const row of dataToInsert) {
      try {
        await client.query(insertQuery, [
          row.Hat_Adi || null,
          row.Calisma_Zamani || null,
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
    
    console.log(`✅ ${insertedCount} kayıt eklendi`);
    return insertedCount;
    
  } catch (err) {
    console.error('clearAndInsertData error:', err);
    throw err;
  }
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

    const tableNames = extractTableName(fileName);
    if (!tableNames || tableNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dosya adı XX_TABLENAME_YYYY_MM_DD.xlsx formatında olmalı'
      });
    }

    console.log(`\n=== 📊 Excel Dosyası: ${fileName} ===`);
    console.log(`=== 📋 ${tableNames.length} tablo oluşturulacak: ${tableNames.join(', ')} ===`);
    console.log(`=== 📋 Toplam ${workbook.worksheets.length} sayfa bulundu ===\n`);

    const allDataToInsert = {};
    // Her tablo için ayrı veri dizisi oluştur
    tableNames.forEach(tableName => {
      allDataToInsert[tableName] = [];
    });

    // TÜM worksheets'leri işle
    for (const worksheet of workbook.worksheets) {
      const sheetName = worksheet.name;
      console.log(`\n🔍 Sayfa işleniyor: "${sheetName}"`);

      const tarifeColumns = [];
    // ExcelJS: İlk 20 satırda T01, T02... başlıklarını ara
    let foundHeaderRow = null;
    
    for (let rowNum = 1; rowNum <= 20; rowNum++) {
      const headerRow = worksheet.getRow(rowNum);
      const tempCols = [];
      let maxTCol = 0;
      
      // Önce T01, T02... veya T1, T2... başlıklarını bul
      for (let col = 4; col <= 30; col++) {
        const cell = headerRow.getCell(col);
        if (!cell || !cell.value) continue;
        const headerValue = String(cell.value).trim();
        
        // T01, T02 veya T1, T2 formatlarını destekle (A) ekli veya eksiz
        const match = headerValue.match(/^(T\d{1,2})(\s*\(A\))?$/);
        if (match) {
          const tarifeName = match[1]; // "T01" veya "T1"
          const hasA = !!match[2]; // "(A)" var mı?
          
          tempCols.push({ col, name: tarifeName, hasA });
          maxTCol = Math.max(maxTCol, col);
        }
      }
      
      // En az 1 tarife başlığı bulduysa
      if (tempCols.length > 0) {
        foundHeaderRow = rowNum;
        
        // Şimdi en sağdaki T sütunundan sonraki sütunları kontrol et (max 5 sütun daha)
        for (let col = maxTCol + 1; col <= maxTCol + 5; col++) {
          const cell = headerRow.getCell(col);
          if (!cell || !cell.value) continue; // Boş hücre varsa atla
          
          const headerValue = String(cell.value).trim();
          
          // (A) olup olmadığını kontrol et
          const match = headerValue.match(/^(.+?)(\s*\(A\))?$/);
          if (match) {
            const baseName = match[1].trim();
            const hasA = !!match[2];
            
            // Boş değilse ve beyaz font değilse ekle
            if (baseName && !isCellHidden(cell)) {
              tempCols.push({ col, name: baseName, hasA });
              console.log(`  ✓ Ek tarife sütunu bulundu: "${headerValue}" (Sütun ${String.fromCharCode(64 + col)})${hasA ? ' → A tablosu' : ''}`);
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        // Sütun numarasına göre sırala
        tempCols.sort((a, b) => a.col - b.col);
        tarifeColumns.push(...tempCols);
        break;
      }
    }

    if (tarifeColumns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'T01, T02... veya T1, T2... tarife sütunları bulunamadı'
      });
    }
    
    console.log(`=== ${tarifeColumns.length} tarife sütunu tespit edildi: ${tarifeColumns.map(t => t.name).join(', ')} ===`);

    const hareketRows = [];
    // ExcelJS: B sütunu (col 2), foundHeaderRow+2'den başla (foundHeaderRow+1 genelde boş)
    const startRowForHareket = foundHeaderRow + 2;
    console.log(`=== Hareket Satırları Taranıyor (Satır ${startRowForHareket}+) ===`);
    
    let foundFirstHareket = false; // İlk Kalkış/Dönüş bulundu mu?
    
    for (let rowNum = startRowForHareket; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const cell = row.getCell(2); // B sütunu
      
      if (!cell || !cell.value) {
        // Boş hücre - ama merged cell kontrolü yap
        if (foundFirstHareket && cell.isMerged) {
          console.log(`Merged cell tespit edildi - tarama tamamlandı (${hareketRows.length} hareket bulundu)`);
          break;
        }
        continue;
      }
      
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

    const dataToInsert = {};
    tableNames.forEach(tableName => {
      dataToInsert[tableName] = [];
    });
    
    // Son Dönüş satırını bul
    const lastDonusRow = hareketRows.filter(h => h.hareket === 'Dönüş').pop();
    const isLastDonus = lastDonusRow ? lastDonusRow.rowNum : null;
    
    // Son Dönüş'ün altındaki satırı kontrol et - eğer tamamen boş veya merged ise atla
    let skipLastDonus = false;
    if (isLastDonus) {
      const nextRow = worksheet.getRow(isLastDonus + 1);
      let hasAnyData = false;
      
      // Tarife sütunlarında herhangi bir veri var mı kontrol et
      for (const tarife of tarifeColumns) {
        const cellBelow = nextRow.getCell(tarife.col);
        if (cellBelow && cellBelow.value && !cellBelow.isMerged) {
          hasAnyData = true;
          break;
        }
      }
      
      skipLastDonus = !hasAnyData; // Veri yoksa atla
      console.log(`Son Dönüş (Row ${isLastDonus}): Altında veri ${hasAnyData ? 'VAR - İŞLENECEK' : 'YOK - ATLANACAK'}`);
    }
    
    console.log(`=== Veri Parse Başladı (${hareketRows.length} hareket satırı x ${tarifeColumns.length} tarife sütunu) ===`);
    for (const hareketRow of hareketRows) {
      // SON DÖNÜŞ SATIRINI ATLA (sadece altında veri yoksa)
      if (skipLastDonus && hareketRow.hareket === 'Dönüş' && hareketRow.rowNum === isLastDonus) {
        console.log(`\n--- ${hareketRow.hareket} (Satır ${hareketRow.rowNum}) - SON DÖNÜŞ ATLANDI (altı boş) ---`);
        continue;
      }
      
      console.log(`\n--- ${hareketRow.hareket} (Satır ${hareketRow.rowNum}) ---`);
      let addedCount = {};
      let skippedCount = 0;
      
      tableNames.forEach(tableName => {
        addedCount[tableName] = 0;
      });
      
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
        
        // DÖNÜŞ için: Altındaki hücreyi kontrol et
        if (hareketRow.hareket === 'Dönüş') {
          const nextRow = worksheet.getRow(hareketRow.rowNum + 1);
          const cellBelow = nextRow.getCell(tarife.col);
          
          const isBelowEmpty = !cellBelow || !cellBelow.value;
          const isBelowWhite = cellBelow && isCellHidden(cellBelow);
          const isBelowMerged = cellBelow && cellBelow.isMerged;
          
          if (isBelowEmpty || isBelowWhite || isBelowMerged) {
            console.log(`  ⚠️ Atlandı: ${timeValue} (${String.fromCharCode(64 + tarife.col)}${hareketRow.rowNum}) - altı ${isBelowEmpty ? 'boş' : isBelowWhite ? 'beyaz' : 'birleştirilmiş'}`);
            skippedCount++;
            continue;
          }
        }

        // Hangi tabloya ekleneceğini belirle
        let targetTable;
        if (tableNames.length === 1) {
          // Tek tablo varsa, hepsini oraya ekle
          targetTable = tableNames[0];
        } else {
          // Birden fazla tablo varsa, (A) olanlar ikinci tabloya
          if (tarife.hasA) {
            targetTable = tableNames[1]; // MC12A gibi
          } else {
            targetTable = tableNames[0]; // MC12 gibi
          }
        }

        dataToInsert[targetTable].push({
          Hat_Adi: targetTable,
          Calisma_Zamani: sheetName,
          Hareket: hareketRow.hareket,
          Tarife: tarife.name,
          Tarife_Saati: timeValue,
          Onaylanan: null,
          Durum: null,
          Plaka: null
        });
        addedCount[targetTable]++;
      }
      
      const addedSummary = tableNames.map(tbl => `${tbl}: ${addedCount[tbl]}`).join(' | ');
      console.log(`  ✅ ${addedSummary}${skippedCount > 0 ? ` | ${skippedCount} beyaz/gizli hücre atlandı` : ''}`);
    }

    // Bu sayfanın verilerini ana listeye ekle
    tableNames.forEach(tableName => {
      const sheetDataCount = dataToInsert[tableName].length;
      allDataToInsert[tableName].push(...dataToInsert[tableName]);
      const totalSoFar = allDataToInsert[tableName].length;
      console.log(`✅ "${sheetName}" sayfasından ${tableName} tablosuna ${sheetDataCount} kayıt toplandı (Toplam şu ana kadar: ${totalSoFar})`);
    });
    console.log(`\n`);
  } // worksheet loop sonu

    // Toplam veri kontrolü
    let totalRecords = 0;
    tableNames.forEach(tableName => {
      totalRecords += allDataToInsert[tableName].length;
    });

    if (totalRecords === 0) {
      return res.status(400).json({
        success: false,
        error: 'Veri parse edilemedi'
      });
    }

    console.log(`\n=== 📦 Toplam ${totalRecords} kayıt tüm sayfalardan toplandı ===\n`);

    // Her tablo için işlemleri yap
    const results = {};
    for (const tableName of tableNames) {
      console.log(`\n=== ${tableName} tablosu işleniyor ===`);
      
      // Tablo oluştur (yoksa)
      const tableCreation = await createTableIfNotExists(client, tableName);
      if (!tableCreation.success) {
        return res.status(500).json({
          success: false,
          error: `${tableName}: ${tableCreation.message}`
        });
      }

      // Veri ekle (clear + insert)
      const insertedCount = await clearAndInsertData(client, tableName, allDataToInsert[tableName]);
      results[tableName] = insertedCount;
      console.log(`✅ ${tableName}: ${insertedCount} kayıt eklendi`);
    }

    return res.status(200).json({
      success: true,
      tables: tableNames,
      sheetsProcessed: workbook.worksheets.length,
      results: results,
      totalRecords: totalRecords,
      message: `${tableNames.length} tablo güncellendi (${workbook.worksheets.length} sayfa işlendi, ${totalRecords} kayıt toplandı)`
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