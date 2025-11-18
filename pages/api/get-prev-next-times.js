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

    console.log('🔍 Get Prev/Next Times - Params:', {
      tableName,
      currentTarifeSaati,
      hareket
    });

    if (!tableName || !currentTarifeSaati) {
      return res.status(400).json({
        success: false,
        error: 'tableName ve currentTarifeSaati gerekli'
      });
    }

    client = await pool.connect();

    // Hareket filtresini hazırla
    const hareketFilter = hareket ? `AND "Hareket" = $2` : '';

    // Önceki saat (currentTarifeSaati'nden küçük en büyük)
    // CAST ile TIME tipine çevirip doğru karşılaştırma yapıyoruz
    const prevQuery = `
      SELECT "Tarife_Saati"
      FROM public."${tableName}"
      WHERE CAST("Tarife_Saati" AS TIME) < CAST($1 AS TIME) ${hareketFilter}
      ORDER BY CAST("Tarife_Saati" AS TIME) DESC
      LIMIT 1;
    `;
    const prevParams = hareket ? [currentTarifeSaati, hareket] : [currentTarifeSaati];

    // Sonraki saat (currentTarifeSaati'nden büyük en küçük)
    const nextQuery = `
      SELECT "Tarife_Saati"
      FROM public."${tableName}"
      WHERE CAST("Tarife_Saati" AS TIME) > CAST($1 AS TIME) ${hareketFilter}
      ORDER BY CAST("Tarife_Saati" AS TIME) ASC
      LIMIT 1;
    `;
    const nextParams = hareket ? [currentTarifeSaati, hareket] : [currentTarifeSaati];

    console.log('📝 Executing queries with params:', {
      prevParams,
      nextParams,
      prevQuery,
      nextQuery
    });

    const prevResult = await client.query(prevQuery, prevParams);
    const nextResult = await client.query(nextQuery, nextParams);

    console.log('📊 Raw SQL Results:', {
      prevRows: prevResult.rows,
      nextRows: nextResult.rows
    });

    const prevTime = prevResult.rows.length > 0 ? prevResult.rows[0].Tarife_Saati : null;
    const nextTime = nextResult.rows.length > 0 ? nextResult.rows[0].Tarife_Saati : null;

    console.log('✅ Prev/Next Times Result:', {
      prevTime,
      nextTime,
      prevRowCount: prevResult.rows.length,
      nextRowCount: nextResult.rows.length
    });

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
