// pages/api/vts-auto-populate-onaylanan.js
// SA65 hattı için VTS geçiş verilerini çekip Onaylanan sütununu otomatik doldurur

import { Pool } from 'pg';
import axios from 'axios';
import https from 'https';
import { URL } from 'url';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 30000,
  max: 20
});

// VTS API Configuration
const VTS_BASE_URL = "https://vts.kentkart.com.tr/api/026/v1";
const VTS_TOKEN = process.env.VTS_ACCESS_TOKEN || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjM1MTIsImF1ZCI6IjMiLCJleHAiOjE3NjU5NTA2NTQsIm5iZiI6MTc2NTc3Nzg1NCwiaWF0IjoxNzY1Nzc3ODU0LCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRrIiwiYjNBNFZUUyJdLCJleHQiOm51bGwsImlzU3VwZXJBZG1pbiI6MCwiaXAiOiIxMC4wLjQwLjgiLCJsb2dpbm1ldGhvZCI6bnVsbCwiYWNjcm9sZSI6bnVsbCwicm9sZSI6WyJ2dHNhZG1pbiJdLCJuZXRzIjpbeyJOSUQiOiIwMjYiLCJEIjoiMSIsIk5BTUUiOiJBTlRBTFlBIn1dLCJsYW5nIjoidHIiLCJ1c2VybmFtZSI6InVndXIueWlsbWF6Iiwic2lkIjo1MTEwNTgyfQ.Z37r5Lssp5Lbed8zf4QY3-Eccj8F0Ydg9rnTHfd7386p3AROgOAaj1VgAT9n-Zhi3TWWtVyWAS2HbA_xVgCB07HmHJ-o_MxrBQslEXRk-vaEJaefF0XtcqQwuZtTShevMFO8TdtkObAZPbYhdZ4a-t3GeIKxSVO25u0rzlaOuAAU5qCF4qFz1Hteqs5rkesdgpHkVYzqrG448Mo7PwpsLhj-pM0Fv81jptVEnYurkWFCenlJtUOHDO89GlhBwLKAGOIuseybkqm1QunsHzUVduaNAyzxioZauv25qinUY_5WA-MVVn2l5K9adqj42RWMSoPmecXV-3b7C9ohRnaq5A';

// Axios instance with SSL bypass and additional configs
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    maxSockets: 50
  }),
  timeout: 30000,
  maxRedirects: 5,
  validateStatus: (status) => status < 500
});

// Durak koordinatları (Sarısu Depolama Merkezi-1)
const DURAK_CONFIG = {
  adi: 'Sarısu Depolama Merkezi-1',
  enlem: 36.830802,
  boylam: 30.596277
};

/**
 * Manuel HTTPS request (axios fallback için)
 */
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Haversine mesafe hesaplama (metre)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const R = 6371000; // metre
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * SA65 araçlarını VTS'den çeker
 */
async function getSA65Vehicles() {
  try {
    const params = new URLSearchParams({
      fields: 'bus_id,car_no,display_route_code',
      sort: 'bus_id|asc',
      dc: Date.now()
    });
    
    const url = `${VTS_BASE_URL}/latestdevicedata/get?${params}`;
    
    console.log('📡 VTS Request URL:', url);
    
    // Manuel HTTPS request kullan
    const response = await httpsRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${VTS_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://vts.kentkart.com.tr/',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });
    
    console.log('✅ VTS Response Status:', response.status);
    const data = response.data;
    
    // İç içe data yapısını çöz
    let vehicles = [];
    if (data?.data?.data) {
      vehicles = data.data.data;
    } else if (data?.data && Array.isArray(data.data)) {
      vehicles = data.data;
    }
    
    // SA65 araçlarını filtrele
    const sa65List = vehicles
      .filter(v => v.display_route_code === 'SA65')
      .map(v => ({
        bus_id: v.bus_id,
        plaka: v.car_no
      }));
    
    return sa65List;
    
  } catch (error) {
    console.error('SA65 araç listesi hatası:', error);
    throw error;
  }
}

/**
 * Aracın geçmiş konum verilerini çeker
 */
async function getVehicleHistory(busId, startTime, endTime) {
  try {
    const formatTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };
    
    const params = new URLSearchParams({
      fields: 'date_time,lat,lon,speed,car_no,bus_id',
      filters: '',
      sort: 'date_time|asc',
      bus_list: busId,
      start_date_time: formatTime(startTime),
      end_date_time: formatTime(endTime),
      dc: Date.now()
    });
    
    const url = `${VTS_BASE_URL}/historicdevicedata/get?${params}`;
    
    // Manuel HTTPS request kullan
    const response = await httpsRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${VTS_TOKEN}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://vts.kentkart.com.tr/',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });
    
    return response.data;
    
  } catch (error) {
    console.error(`VTS history error for bus ${busId}:`, error);
    return null;
  }
}

/**
 * 500m lineer artış mantığı ile geçiş tespiti
 */
function analyzeCrossingsLinear(historyData, plaka) {
  if (!historyData) return [];
  
  // Veriyi parse et
  let tracks = [];
  if (historyData?.data?.data) {
    tracks = historyData.data.data;
  } else if (historyData?.data && Array.isArray(historyData.data)) {
    tracks = historyData.data;
  } else if (Array.isArray(historyData)) {
    tracks = historyData;
  }
  
  if (!tracks || tracks.length === 0) {
    return [];
  }
  
  const gecisler = [];
  
  // Durum takibi
  let previousDistance = null;
  let minDistance = null;
  let minDistanceTime = null;
  let isApproaching = false;
  let isLeaving = false;
  let crossed500m = false;
  
  for (const point of tracks) {
    const lat = point.lat;
    const lon = point.lon;
    const timeStr = point.date_time;
    
    if (!lat || !lon || lat === 0 || lon === 0) {
      continue;
    }
    
    // Durağa olan mesafe
    const distance = haversineDistance(
      DURAK_CONFIG.enlem,
      DURAK_CONFIG.boylam,
      lat,
      lon
    );
    
    // İlk nokta
    if (previousDistance === null) {
      previousDistance = distance;
      if (distance < 200) {
        minDistance = distance;
        minDistanceTime = timeStr;
      }
      continue;
    }
    
    // Mesafe değişimi
    const distanceChange = distance - previousDistance;
    
    // YAKLAŞMA FAZI: Mesafe azalıyor
    if (distanceChange < -5) {
      if (!isApproaching) {
        isApproaching = true;
        isLeaving = false;
        crossed500m = false;
      }
      
      // En yakın noktayı kaydet
      if (minDistance === null || distance < minDistance) {
        minDistance = distance;
        minDistanceTime = timeStr;
      }
    }
    // UZAKLAŞMA FAZI: Mesafe artıyor
    else if (distanceChange > 5) {
      if (!isLeaving) {
        if (isApproaching && minDistance !== null) {
          isLeaving = true;
          isApproaching = false;
        }
      }
      
      // Uzaklaşırken 500m'yi geçti mi?
      if (isLeaving && minDistance !== null) {
        if (!crossed500m && distance > 500 && minDistance < 500) {
          // GEÇİŞ TESPİT EDİLDİ!
          crossed500m = true;
          
          // Geçiş zamanı = En yakın olduğu an
          if (minDistanceTime && minDistanceTime.length >= 14) {
            const timeStr = minDistanceTime.substring(0, 14);
            const year = parseInt(timeStr.substring(0, 4));
            const month = parseInt(timeStr.substring(4, 6)) - 1;
            const day = parseInt(timeStr.substring(6, 8));
            const hours = parseInt(timeStr.substring(8, 10));
            const minutes = parseInt(timeStr.substring(10, 12));
            const seconds = parseInt(timeStr.substring(12, 14));
            
            const gecisTime = new Date(year, month, day, hours, minutes, seconds);
            
            gecisler.push({
              plaka: plaka,
              durak_adi: DURAK_CONFIG.adi,
              gecis_zamani: gecisTime,
              min_mesafe: Math.round(minDistance * 10) / 10,
              cikis_mesafe: Math.round(distance * 10) / 10
            });
          }
          
          // Reset
          minDistance = null;
          minDistanceTime = null;
          isLeaving = false;
        }
      }
    }
    
    previousDistance = distance;
  }
  
  return gecisler;
}

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
  const crossingTime = crossing.gecis_zamani;
  const crossingTimeStr = `${String(crossingTime.getHours()).padStart(2, '0')}:${String(crossingTime.getMinutes()).padStart(2, '0')}:${String(crossingTime.getSeconds()).padStart(2, '0')}`;
  
  const toleranceMinutes = 30;
  
  // 1. Önce plaka eşleşmesi dene
  const plateMatches = scheduleRows.filter(row => {
    if (row.Plaka !== crossing.plaka) return false;
    
    const timeDiff = getTimeDifferenceMinutes(row.Tarife_Saati, crossingTimeStr);
    return timeDiff !== null && timeDiff <= toleranceMinutes;
  });
  
  if (plateMatches.length > 0) {
    // En yakın olanı döndür
    return plateMatches.reduce((closest, current) => {
      const closestDiff = getTimeDifferenceMinutes(closest.Tarife_Saati, crossingTimeStr);
      const currentDiff = getTimeDifferenceMinutes(current.Tarife_Saati, crossingTimeStr);
      return currentDiff < closestDiff ? current : closest;
    });
  }
  
  // 2. Belediye Aracı satırlarını dene (henüz doldurulmamış)
  const belediyeMatches = scheduleRows.filter(row => {
    if (row.Plaka !== 'Belediye Aracı') return false;
    if (row.Onaylanan && row.Onaylanan.trim() !== '') return false; // Zaten dolu
    
    const timeDiff = getTimeDifferenceMinutes(row.Tarife_Saati, crossingTimeStr);
    return timeDiff !== null && timeDiff <= toleranceMinutes;
  });
  
  if (belediyeMatches.length > 0) {
    // En yakın olanı döndür
    return belediyeMatches.reduce((closest, current) => {
      const closestDiff = getTimeDifferenceMinutes(closest.Tarife_Saati, crossingTimeStr);
      const currentDiff = getTimeDifferenceMinutes(current.Tarife_Saati, crossingTimeStr);
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
    console.log('🚌 VTS Auto-Populate başlatıldı...');
    console.log('Environment check:', {
      hasDatabase: !!process.env.DATABASE_URL,
      hasVTSToken: !!VTS_TOKEN,
      nodeEnv: process.env.NODE_ENV
    });
    
    const { hat } = req.body;
    const targetHat = hat || 'SA65';
    
    // 1. SA65 araçlarını al
    console.log('📡 VTS\'den SA65 araçları çekiliyor...');
    const vehicles = await getSA65Vehicles();
    
    if (!vehicles || vehicles.length === 0) {
      throw new Error('SA65 araçları VTS\'de bulunamadı');
    }
    
    console.log(`✅ ${vehicles.length} SA65 aracı bulundu:`, vehicles.map(v => v.plaka).join(', '));
    
    // 2. Bugünün saat aralığını belirle (06:00 - şu an)
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
    const endTime = now;
    
    console.log(`⏰ Zaman aralığı: ${startTime.toLocaleTimeString('tr-TR')} - ${endTime.toLocaleTimeString('tr-TR')}`);
    
    // 3. Her araç için geçmiş verilerini al ve analiz et
    const allCrossings = [];
    
    for (const vehicle of vehicles) {
      console.log(`🔍 ${vehicle.plaka} analiz ediliyor...`);
      
      const history = await getVehicleHistory(vehicle.bus_id, startTime, endTime);
      
      if (history) {
        const crossings = analyzeCrossingsLinear(history, vehicle.plaka);
        
        console.log(`   ✓ ${crossings.length} geçiş tespit edildi`);
        
        allCrossings.push(...crossings);
      } else {
        console.log(`   ⚠️ Veri alınamadı`);
      }
    }
    
    console.log(`\n📊 Toplam ${allCrossings.length} geçiş tespit edildi`);
    
    if (allCrossings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'VTS verisi alındı ancak geçiş tespit edilmedi',
        updated: 0,
        crossings: 0
      });
    }
    
    // 4. Veritabanından SA65 Kalkış satırlarını çek
    console.log('📊 Veritabanına bağlanılıyor...');
    client = await pool.connect();
    console.log('✅ Database bağlantısı başarılı');
    
    const query = `
      SELECT id, "Hat_Adi", "Tarife_Saati", "Plaka", "Onaylanan", "Hareket"
      FROM public."${targetHat}"
      WHERE "Hareket" = 'Kalkış'
      ORDER BY "Tarife_Saati" ASC;
    `;
    
    console.log('📋 Query çalıştırılıyor:', query);
    const result = await client.query(query);
    const scheduleRows = result.rows;
    
    console.log(`📋 Veritabanında ${scheduleRows.length} Kalkış satırı bulundu`);
    
    // 5. Her geçişi en uygun tarife saatine eşleştir
    const updates = [];
    
    for (const crossing of allCrossings) {
      const matchedRow = findBestMatch(crossing, scheduleRows);
      
      if (matchedRow) {
        const crossingTimeStr = `${String(crossing.gecis_zamani.getHours()).padStart(2, '0')}:${String(crossing.gecis_zamani.getMinutes()).padStart(2, '0')}:${String(crossing.gecis_zamani.getSeconds()).padStart(2, '0')}`;
        
        updates.push({
          id: matchedRow.id,
          plaka: crossing.plaka,
          tarife_saati: matchedRow.Tarife_Saati,
          gecis_zamani: crossingTimeStr,
          min_mesafe: crossing.min_mesafe
        });
        
        console.log(`   ✓ Eşleşme: ${crossing.plaka} ${crossingTimeStr} → Tarife ${matchedRow.Tarife_Saati} (${matchedRow.Plaka})`);
      }
    }
    
    console.log(`\n🎯 ${updates.length} eşleşme bulundu, güncelleniyor...`);
    
    // 6. Onaylanan sütununu güncelle
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
      crossings: allCrossings.length,
      vehicles: vehicles.length,
      details: updates.map(u => ({
        plaka: u.plaka,
        tarife: u.tarife_saati,
        gerceklesen: u.gecis_zamani,
        mesafe: u.min_mesafe + 'm'
      }))
    });

  } catch (err) {
    console.error('❌ VTS Auto-Populate hatası:', err);
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
