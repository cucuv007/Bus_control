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
          isim: hareketRow.hareket,
          Tarife: tarife.name,
          Tarife_Saati: timeValue
        });
      }
    }

    if (dataToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Veri parse edilemedi'
      });
    }

    const { data, error } = await supabase
      .from(tableName)
      .upsert(dataToInsert, { onConflict: 'id' });

    if (error) {
      if (error.message.includes('relation does not exist')) {
        return res.status(500).json({
          success: false,
          error: `Tablo "${tableName}" yok. Supabase Dashboard SQL Editor'de oluştur.`
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
      tarifeColumns: tarifeColumns.map(t => t.name)
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' }, responseLimit: '50mb' }
};