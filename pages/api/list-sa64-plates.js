// pages/api/list-sa64-plates.js
// SA64 tablosundaki tüm plakaları listeler

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    console.log('📋 SA64 tablosundaki tüm plakalar listeleniyor...');

    client = await pool.connect();

    // Tüm benzersiz plakaları çek
    const query = `
      SELECT DISTINCT "Plaka"
      FROM public."SA64"
      WHERE "Plaka" IS NOT NULL 
        AND "Plaka" != ''
      ORDER BY "Plaka";
    `;

    const result = await client.query(query);
    
    console.log(`✅ ${result.rows.length} benzersiz plaka bulundu`);

    const plates = result.rows.map(row => row.Plaka);

    return res.status(200).json({
      success: true,
      plates,
      totalPlates: plates.length,
      source: 'PostgreSQL - SA64 tablosu'
    });

  } catch (err) {
    console.error('List SA64 plates error:', err);
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
