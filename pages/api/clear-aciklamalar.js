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
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let client;
  try {
    console.log('🧹 Açıklama tabloları temizleniyor...');

    client = await pool.connect();

    // 1. Operasyon_Açıklama tablosunu temizle
    await client.query('DELETE FROM public."Operasyon_Açıklama"');
    console.log('✅ Operasyon_Açıklama temizlendi');

    // 2. Depolama_Açıklama tablosunu temizle
    await client.query('DELETE FROM public."Depolama_Açıklama"');
    console.log('✅ Depolama_Açıklama temizlendi');

    // 3. Sequence'leri sıfırla
    try {
      await client.query('ALTER SEQUENCE public."Operasyon_Açıklama_id_seq" RESTART WITH 1');
      await client.query('ALTER SEQUENCE public."Depolama_Açıklama_id_seq" RESTART WITH 1');
      console.log('✅ Sequenceler sıfırlandı');
    } catch (seqErr) {
      console.warn('⚠️ Sequence sıfırlama hatası (kritik değil):', seqErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Tablolar başarıyla temizlendi',
      operasyon: 'Temizlendi',
      depolama: 'Temizlendi'
    });

  } catch (err) {
    console.error('Clear aciklamalar hatası:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Tablolar temizlenemedi'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}
