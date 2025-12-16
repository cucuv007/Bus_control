// pages/api/vts-process-crossings.js
// Frontend'den gelen VTS crossing verilerini işler ve database'i günceller

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20
});

/**
 * Zaman parse fonksiyonu (HH:MM veya HH:MM:SS formatını destekler)
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  
  if (isNaN(hours) || isNaN(minutes)) return null;
  
  return hours * 60 + minutes;
}

/**
 * İki zaman arasındaki farkı dakika cinsinden hesaplar
 */
function getTimeDifferenceMinutes(time1, time2) {
  const mins1 = parseTimeToMinutes(time1);
  const mins2 = parseTimeToMinutes(time2);
  
  if (mins1 === null || mins2 === null) return null;
  
  return Math.abs(mins1 - mins2);
}

/**
 * VTS geçiş zamanını en yakın tarife saatine eşleştirir (±30 dakika)
 */
function findBestMatch(crossing, scheduleRows) {
  const toleranceMinutes = 30;
  
  // 1. Önce plaka eşleşmesi dene (sadece boş Onaylanan satırları)
  const plateMatches = scheduleRows.filter(row => {
    if (row.Plaka !== crossing.plaka) return false;
    if (row.Onaylanan && row.Onaylanan.trim() !== '') return false; // Zaten dolu ise atla
    
    const timeDiff = getTimeDifferenceMinutes(row.Tarife_Saati, crossing.gecis_zamani);
    return timeDiff !== null && timeDiff <= toleranceMinutes;
  });
  
  if (plateMatches.length > 0) {
    return plateMatches.reduce((closest, current) => {
      const closestDiff = getTimeDifferenceMinutes(closest.Tarife_Saati, crossing.gecis_zamani);
      const currentDiff = getTimeDifferenceMinutes(current.Tarife_Saati, crossing.gecis_zamani);
      return currentDiff < closestDiff ? current : closest;
    });
  }
  
  // 2. Belediye Aracı satırlarını dene (henüz doldurulmamış)
  const belediyeMatches = scheduleRows.filter(row => {
    if (row.Plaka !== 'Belediye Aracı') return false;
    if (row.Onaylanan && row.Onaylanan.trim() !== '') return false;
    
    const timeDiff = getTimeDifferenceMinutes(row.Tarife_Saati, crossing.gecis_zamani);
    return timeDiff !== null && timeDiff <= toleranceMinutes;
  });
  
  if (belediyeMatches.length > 0) {
    return belediyeMatches.reduce((closest, current) => {
      const closestDiff = getTimeDifferenceMinutes(closest.Tarife_Saati, crossing.gecis_zamani);
      const currentDiff = getTimeDifferenceMinutes(current.Tarife_Saati, crossing.gecis_zamani);
      return currentDiff < closestDiff ? current : closest;
    });
  }
  
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try {
    console.log('🔄 VTS Process Crossings başlatıldı...');
    
    const { crossings, hat } = req.body;
    const targetHat = hat || 'SA65';
    
    if (!crossings || !Array.isArray(crossings)) {
      return res.status(400).json({
        success: false,
        error: 'crossings array gerekli'
      });
    }
    
    console.log(`📊 ${crossings.length} geçiş verisi alındı`);
    
    // Veritabanından SA65 Kalkış satırlarını çek
    console.log('📊 Veritabanına bağlanılıyor...');
    client = await pool.connect();
    console.log('✅ Database bağlantısı başarılı');
    
    const query = `
      SELECT id, "Hat_Adi", "Tarife_Saati", "Plaka", "Onaylanan", "Hareket"
      FROM public."${targetHat}"
      WHERE "Hareket" = 'Kalkış'
      ORDER BY "Tarife_Saati" ASC;
    `;
    
    const result = await client.query(query);
    const scheduleRows = result.rows;
    
    console.log(`📋 Veritabanında ${scheduleRows.length} Kalkış satırı bulundu`);
    console.log(`📋 Boş Onaylanan: ${scheduleRows.filter(r => !r.Onaylanan || r.Onaylanan.trim() === '').length}`);
    
    // Her geçişi en uygun tarife saatine eşleştir
    const updates = [];
    
    for (const crossing of crossings) {
      console.log(`🔍 Geçiş kontrol: ${crossing.plaka} @ ${crossing.gecis_zamani}`);
      const matchedRow = findBestMatch(crossing, scheduleRows);
      
      if (matchedRow) {
        updates.push({
          id: matchedRow.id,
          plaka: crossing.plaka,
          tarife_saati: matchedRow.Tarife_Saati,
          gecis_zamani: crossing.gecis_zamani,
          min_mesafe: crossing.min_mesafe
        });
        
        console.log(`   ✓ Eşleşme: ${crossing.plaka} ${crossing.gecis_zamani} → Tarife ${matchedRow.Tarife_Saati} (${matchedRow.Plaka})`);
      } else {
        console.log(`   ✗ Eşleşme bulunamadı: ${crossing.plaka} ${crossing.gecis_zamani}`);
      }
    }
    
    console.log(`\n🎯 ${updates.length} eşleşme bulundu, güncelleniyor...`);
    
    // Onaylanan sütununu güncelle
    let updatedCount = 0;
    
    for (const update of updates) {
      const updateQuery = `
        UPDATE public."${targetHat}"
        SET "Onaylanan" = $1
        WHERE id = $2;
      `;
      
      const updateResult = await client.query(updateQuery, [update.gecis_zamani, update.id]);
      updatedCount += updateResult.rowCount;
    }
    
    console.log(`✅ ${updatedCount} satır güncellendi`);
    
    return res.status(200).json({
      success: true,
      message: `${updatedCount} satır otomatik onaylandı`,
      updated: updatedCount,
      crossings: crossings.length,
      details: updates.map(u => ({
        plaka: u.plaka,
        tarife: u.tarife_saati,
        gerceklesen: u.gecis_zamani,
        mesafe: u.min_mesafe + 'm'
      }))
    });

  } catch (err) {
    console.error('❌ Process Crossings hatası:', err);
    console.error('Stack trace:', err.stack);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}
