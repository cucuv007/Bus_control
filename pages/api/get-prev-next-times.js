// pages/api/get-prev-next-times.js
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
    const { tableName, currentTarifeSaati, hareket } = req.body;

    if (!tableName || !currentTarifeSaati) {
      return res.status(400).json({
        success: false,
        error: 'tableName ve currentTarifeSaati gerekli'
      });
    }

    client = await pool.connect();

    // Hareket filtresini hazırla
    const hareketFilter = hareket ? `AND "Hareket" = $3` : '';
    const params = hareket ? [currentTarifeSaati, currentTarifeSaati, hareket] : [currentTarifeSaati, currentTarifeSaati];

    // Önceki saat (currentTarifeSaati'nden küçük en büyük)
    const prevQuery = `
      SELECT "Tarife_Saati"
      FROM public."${tableName}"
      WHERE "Tarife_Saati" < $1 ${hareketFilter}
      ORDER BY "Tarife_Saati" DESC
      LIMIT 1;
    `;

    // Sonraki saat (currentTarifeSaati'nden büyük en küçük)
    const nextQuery = `
      SELECT "Tarife_Saati"
      FROM public."${tableName}"
      WHERE "Tarife_Saati" > $2 ${hareketFilter}
      ORDER BY "Tarife_Saati" ASC
      LIMIT 1;
    `;

    const prevResult = await client.query(prevQuery, params);
    const nextResult = await client.query(nextQuery, params);

    const prevTime = prevResult.rows.length > 0 ? prevResult.rows[0].Tarife_Saati : null;
    const nextTime = nextResult.rows.length > 0 ? nextResult.rows[0].Tarife_Saati : null;

    return res.status(200).json({
      success: true,
      prevTime: prevTime,
      nextTime: nextTime
    });

  } catch (err) {
    console.error('Get prev/next times error:', err);
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
