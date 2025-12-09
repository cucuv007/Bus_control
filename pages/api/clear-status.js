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

    // Hatları grupla
    const hatGroups = {};
    rows.forEach(row => {
      const { Hat_Adi } = row;
      if (!hatGroups[Hat_Adi]) {
        hatGroups[Hat_Adi] = [];
      }
      hatGroups[Hat_Adi].push(row);
    });

    console.log(`📊 ${Object.keys(hatGroups).length} farklı hat tablosunda işlem yapılacak`);

    // Her hat için toplu UPDATE
    for (const [hatAdi, hatRows] of Object.entries(hatGroups)) {
      try {
        // WHERE koşullarını oluştur
        const conditions = hatRows.map((row, idx) => {
          const { Tarife, Tarife_Saati, Calisma_Zamani, Hareket } = row;
          // SQL injection'dan korunmak için escape
          const escapeSql = (val) => val ? val.replace(/'/g, "''") : val;
          
          let cond = `("Tarife" = '${escapeSql(Tarife)}' AND "Tarife_Saati" = '${escapeSql(Tarife_Saati)}'`;
          if (Calisma_Zamani) {
            cond += ` AND "Çalışma_Zamanı" = '${escapeSql(Calisma_Zamani)}'`;
          }
          if (Hareket) {
            cond += ` AND "Hareket" = '${escapeSql(Hareket)}'`;
          }
          cond += ')';
          return cond;
        }).join(' OR ');

        const query = `
          UPDATE public."${hatAdi}"
          SET "Onaylanan" = NULL, "Durum" = NULL
          WHERE ${conditions};
        `;

        console.log(`🔍 ${hatAdi} için query:`, query);
        
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
