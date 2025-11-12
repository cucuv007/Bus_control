import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function createTableIfNotExists(tableName) {
  // Tablo var mı kontrol et
  const { data: tableExists, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .single();
  
  // Eğer tablo zaten varsa hiçbir şey yapma
  if (tableExists && tableExists.table_name === tableName) {
    return { success: true, created: false, message: `Tablo "${tableName}" zaten var` };
  }
  
  // Tablo yoksa oluştur - Supabase ile doğrudan SQL çalıştırmak için admin API kullanmalıyız
  // Client-side Supabase RPC veya SQL query doğrudan çalıştırmak için server-side helper gerekli
  // Şimdilik: Supabase Admin API ile fetch kullanarak SQL çalıştırıyoruz
  try {
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
    `;
    
    // Supabase'de SQL doğrudan çalıştırmak için fetch ile REST API endpoint kullanıyoruz
    // /rest/v1/rpc endpoint ile custom function veya alt alternatif: Supabase Admin kullan
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql: createTableSQL })
    });
    
    if (!response.ok) {
      // exec_sql RPC yoksa, alternatif: kullanıcıya tablo oluştur mesajı ver
      return { success: false, created: false, message: `Tablo oluşturulamadı. Supabase'de manuel oluşturun: CREATE TABLE public."${tableName}" (...)` };
    }
    
    // Tablo oluşturulduktan sonra Supabase cache'in güncellenmesi için bekle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { success: true, created: true, message: `Tablo "${tableName}" başarıyla oluşturuldu` };
  } catch (err) {
    console.error('Table creation error:', err);
    return { success: false, created: false, message: `Tablo oluşturma başarısız: ${err.message}` };
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

  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'fileName ve fileData gerekli'
      });
    }

    const buffer = Buffer.from(fileData, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: false, cellStyles: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const tableName = extractTableName(fileName);
    if (!tableName) {
      return res.status(400).json({
        success: false,
        error: 'Dosya adı XX_TABLENAME_YYYY_MM_DD.xlsx formatında olmalı'
      });
    }
  // Kullanıcı isteğine göre tablo adı büyük/küçük harf duyarlı olarak kullanılacak
  // (kullanıcının oluşturduğu tablo: public."TCD49A")

    const tarifeColumns = [];
    for (let col = 4; col < 30; col++) {
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
    const tableCreation = await createTableIfNotExists(tableName);
    if (!tableCreation.success && tableCreation.message.includes('Supabase\'de manuel')) {
      console.warn(tableCreation.message);
    }

    // Eğer tablo yeni oluşturulduysa, fresh Supabase client kullan
    let upsertClient = supabase;
    if (tableCreation.created) {
      // Yeni bir Supabase client instance oluştur (schema cache'i temiz olacak)
      upsertClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      // Cache refresh için bekle
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Upsert: tablo tarafında Tarife_Saati primary key olarak tanımlı, ona göre onConflict kullan
    const { data, error } = await upsertClient
      .from(`"${tableName}"`)
      .upsert(dataToInsert, { onConflict: 'Tarife_Saati' });

    if (error) {
      if (error.message.includes('relation does not exist')) {
        return res.status(500).json({
          success: false,
          error: `Tablo "${tableName}" yok. Supabase Dashboard SQL Editor'de oluştur veya dosyayı yeniden yükle.`,
          tableCreationHint: tableCreation.message
        });
      }
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      tableName,
      sheetName,
      inserted: dataToInsert.length,
      message: `${dataToInsert.length} sefer eklendi`,
      tarifeColumns: tarifeColumns.map(t => t.name),
      tableCreation: tableCreation
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' }, responseLimit: '50mb' }
};