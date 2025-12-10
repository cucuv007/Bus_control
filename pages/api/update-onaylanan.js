// pages/api/update-onaylanan.js
// Manuel veya otomatik olarak Onaylanan sütununu günceller

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    const { hat, plaka, onaylananZaman } = req.body;

    if (!hat || !plaka) {
      return res.status(400).json({
        success: false,
        error: 'hat ve plaka gerekli'
      });
    }

    const zaman = onaylananZaman || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Zaman formatını kontrol et (HH:MM:SS veya HH:MM formatında olmalı)
    if (!zaman || zaman.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir zaman giriniz (örn: 10:30:00)'
      });
    }

    console.log(`⏱️ Onaylanan güncelleniyor: Hat=${hat}, Plaka=${plaka}, Zaman=${zaman}`);

    client = await pool.connect();

    // İlgili satırı bul ve güncelle
    const query = `
      UPDATE public."${hat}"
      SET "Onaylanan" = $1
      WHERE "Plaka" = $2
      AND ("Onaylanan" IS NULL OR "Onaylanan" = '');
    `;

    const result = await client.query(query, [zaman, plaka]);

    console.log(`✅ ${result.rowCount} satır güncellendi`);

    return res.status(200).json({
      success: true,
      updatedCount: result.rowCount,
      hat,
      plaka,
      onaylananZaman: zaman
    });

  } catch (err) {
    console.error('Update onaylanan error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}
