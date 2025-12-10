// pages/api/get-sa64-vehicles.js
// SA64 hattındaki araçların konumlarını çeker

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
    console.log('🚌 SA64 hattı araçları kontrol ediliyor...');

    // Takip edilecek plakalar
    const watchPlates = ['07AU0215', '07AU0455', '07AU0371', '07BGV037'];
    
    console.log('📋 Takip edilen plakalar:', watchPlates);

    client = await pool.connect();

    // SA64 tablosundan bu plakaların bilgilerini çek
    const query = `
      SELECT "Plaka", "Tarife", "Tarife_Saati", "Hareket", "Onaylanan", "Durum", "Çalışma_Zamanı"
      FROM public."SA64"
      WHERE "Plaka" = ANY($1::text[])
      ORDER BY "Plaka", "Tarife_Saati";
    `;

    const result = await pool.query(query, [watchPlates]);
    
    console.log(`✅ ${result.rows.length} kayıt bulundu`);

    // Plakaları formatla
    const vehicles = result.rows.map(row => ({
      hat: 'SA64',
      plaka: row.Plaka,
      tarife: row.Tarife,
      tarifeSaati: row.Tarife_Saati,
      calismaZamani: row.Çalışma_Zamanı,
      hareket: row.Hareket,
      onaylanan: row.Onaylanan,
      durum: row.Durum,
      // Gerçek konum verisi için AntalyaKart API gerekli
      lat: null,
      lon: null,
      hiz: null,
      durakMesafe: null,
      sonGuncelleme: new Date().toISOString(),
      note: 'Konum verisi için AntalyaKart API gerekli'
    }));

    return res.status(200).json({
      success: true,
      vehicles,
      totalVehicles: vehicles.length,
      watchPlates,
      source: 'PostgreSQL - SA64 tablosu',
      note: 'Takip edilen plakalar: ' + watchPlates.join(', ') + '. Gerçek zamanlı konum verisi için AntalyaKart API erişimi gerekli.',
      recommendation: 'AntalyaKart web sitesini Chrome DevTools ile analiz ederek gerçek API endpoint\'ini bulmamız gerekiyor.'
    });

  } catch (err) {
    console.error('Get SA64 vehicles error:', err);
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
