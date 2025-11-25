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
    const { rows } = req.body; // Array of row objects

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'rows array gerekli'
      });
    }

    console.log(`🧹 ${rows.length} satırın Onaylanan ve Durum sütunları temizlenecek...`);

    client = await pool.connect();

    let updatedCount = 0;

    for (const row of rows) {
      const { Hat_Adi, Tarife, Tarife_Saati, Calisma_Zamani, Hareket } = row;

      if (!Hat_Adi || !Tarife_Saati) {
        console.warn('⚠️ Eksik veri, atlanıyor:', row);
        continue;
      }

      // UPDATE query
      let query = `
        UPDATE public."${Hat_Adi}"
        SET "Onaylanan" = NULL, "Durum" = NULL
        WHERE "Tarife" = $1 AND "Tarife_Saati" = $2
      `;

      const params = [Tarife, Tarife_Saati];
      let paramIndex = 3;

      // Çalışma_Zamanı filtresi
      if (Calisma_Zamani) {
        query += ` AND "Çalışma_Zamanı" = $${paramIndex}`;
        params.push(Calisma_Zamani);
        paramIndex++;
      }

      // Hareket filtresi
      if (Hareket) {
        query += ` AND "Hareket" = $${paramIndex}`;
        params.push(Hareket);
      }

      query += ';';

      try {
        const result = await client.query(query, params);
        updatedCount += result.rowCount;
        console.log(`✅ ${Hat_Adi} - ${Tarife_Saati} (${Hareket || 'Tümü'}) temizlendi`);
      } catch (err) {
        console.error(`❌ Güncelleme hatası (${Hat_Adi}):`, err.message);
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
