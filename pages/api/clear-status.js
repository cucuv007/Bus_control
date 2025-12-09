// pages/api/clear-status.js
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
    const { hatlar } = req.body; // Hat sütunundaki tablo isimleri

    if (!hatlar || !Array.isArray(hatlar) || hatlar.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'hatlar array gerekli'
      });
    }

    console.log(`🧹 ${hatlar.length} tablonun Onaylanan ve Durum sütunları temizlenecek...`);
    console.log(`📋 Tablolar:`, hatlar);

    client = await pool.connect();

    let updatedCount = 0;

    // Her tablo için tüm satırları temizle
    for (const hatAdi of hatlar) {
      try {
        const query = `
          UPDATE public."${hatAdi}"
          SET "Onaylanan" = NULL, "Durum" = NULL;
        `;

        console.log(`🔍 ${hatAdi} tablosu temizleniyor...`);
        
        const result = await client.query(query);
        updatedCount += result.rowCount;
        console.log(`✅ ${hatAdi} - ${result.rowCount} satır temizlendi`);
      } catch (err) {
        console.error(`❌ ${hatAdi} temizlenemedi:`, err.message);
        console.error(`📄 Hata detayı:`, err);
      }
    }

    console.log(`✅ Toplam ${updatedCount} satır temizlendi`);

    return res.status(200).json({
      success: true,
      updatedCount
    });

  } catch (err) {
    console.error('Clear status error:', err);
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
