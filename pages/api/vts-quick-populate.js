// Hızlı VTS populate - sadece son 3 saatin verisi
import { Pool } from 'pg';
import https from 'https';
import { URL } from 'url';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 5000,
  max: 10
});

const VTS_BASE_URL = "https://vts.kentkart.com.tr/api/026/v1";
const VTS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjM1MTIsImF1ZCI6IjMiLCJleHAiOjE3NjU5NTA2NTQsIm5iZiI6MTc2NTc3Nzg1NCwiaWF0IjoxNzY1Nzc3ODU0LCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRrIiwiYjNBNFZUUyJdLCJleHQiOm51bGwsImlzU3VwZXJBZG1pbiI6MCwiaXAiOiIxMC4wLjQwLjgiLCJsb2dpbm1ldGhvZCI6bnVsbCwiYWNjcm9sZSI6bnVsbCwicm9sZSI6WyJ2dHNhZG1pbiJdLCJuZXRzIjpbeyJOSUQiOiIwMjYiLCJEIjoiMSIsIk5BTUUiOiJBTlRBTFlBIn1dLCJsYW5nIjoidHIiLCJ1c2VybmFtZSI6InVndXIueWlsbWF6Iiwic2lkIjo1MTEwNTgyfQ.Z37r5Lssp5Lbed8zf4QY3-Eccj8F0Ydg9rnTHfd7386p3AROgOAaj1VgAT9n-Zhi3TWWtVyWAS2HbA_xVgCB07HmHJ-o_MxrBQslEXRk-vaEJaefF0XtcqQwuZtTShevMFO8TdtkObAZPbYhdZ4a-t3GeIKxSVO25u0rzlaOuAAU5qCF4qFz1Hteqs5rkesdgpHkVYzqrG448Mo7PwpsLhj-pM0Fv81jptVEnYurkWFCenlJtUOHDO89GlhBwLKAGOIuseybkqm1QunsHzUVduaNAyzxioZauv25qinUY_5WA-MVVn2l5K9adqj42RWMSoPmecXV-3b7C9ohRnaq5A';

const DURAK = { enlem: 36.830802, boylam: 30.596277 };

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${VTS_TOKEN}`
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON parse failed'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function analyzeCrossingsLinear(tracks, plaka) {
  const gecisler = [];
  let previousDistance = null, minDistance = null, minDistanceTime = null;
  let isApproaching = false, isLeaving = false, crossed500m = false;

  for (const point of tracks) {
    if (!point.lat || !point.lon || point.lat === 0 || point.lon === 0) continue;

    const distance = haversineDistance(DURAK.enlem, DURAK.boylam, point.lat, point.lon);

    if (previousDistance === null) {
      previousDistance = distance;
      if (distance < 200) {
        minDistance = distance;
        minDistanceTime = point.date_time;
      }
      continue;
    }

    const distanceChange = distance - previousDistance;

    if (distanceChange < -5) {
      if (!isApproaching) {
        isApproaching = true;
        isLeaving = false;
        crossed500m = false;
      }
      if (minDistance === null || distance < minDistance) {
        minDistance = distance;
        minDistanceTime = point.date_time;
      }
    } else if (distanceChange > 5) {
      if (!isLeaving && isApproaching && minDistance !== null) {
        isLeaving = true;
        isApproaching = false;
      }

      if (isLeaving && minDistance !== null && !crossed500m && distance > 500 && minDistance < 500) {
        crossed500m = true;
        const timeStr = minDistanceTime.substring(0, 14);
        const hours = parseInt(timeStr.substring(8, 10));
        const minutes = parseInt(timeStr.substring(10, 12));
        const seconds = parseInt(timeStr.substring(12, 14));

        gecisler.push({
          plaka: plaka,
          gecis_zamani: `${hours}:${minutes}:${seconds}`,
          min_mesafe: Math.round(minDistance * 10) / 10
        });

        minDistance = null;
        minDistanceTime = null;
        isLeaving = false;
      }
    }

    previousDistance = distance;
  }

  return gecisler;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getTimeDifferenceMinutes(time1, time2) {
  const mins1 = parseTimeToMinutes(time1);
  const mins2 = parseTimeToMinutes(time2);
  if (mins1 === null || mins2 === null) return null;
  return Math.abs(mins1 - mins2);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. SA65 araçlarını çek
    const vehiclesUrl = `${VTS_BASE_URL}/latestdevicedata/get?fields=bus_id,car_no,display_route_code&sort=bus_id|asc&dc=${Date.now()}`;
    const vehiclesData = await httpsGet(vehiclesUrl);
    let vehicles = vehiclesData?.data?.data || vehiclesData?.data || [];
    const sa65Vehicles = vehicles.filter(v => v.display_route_code === 'SA65');

    if (sa65Vehicles.length === 0) {
      return res.status(200).json({ success: false, error: 'SA65 araçları bulunamadı', updated: 0 });
    }

    // 2. Sadece son 3 saatin verisi (hızlı)
    const now = new Date();
    const startTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 saat önce

    const formatTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };

    const allCrossings = [];

    // 3. Her araç için geçiş tespiti (paralel değil - timeout riski)
    for (const vehicle of sa65Vehicles) {
      const historyUrl = `${VTS_BASE_URL}/historicdevicedata/get?fields=date_time,lat,lon,car_no,bus_id&filters=&sort=date_time|asc&bus_list=${vehicle.bus_id}&start_date_time=${formatTime(startTime)}&end_date_time=${formatTime(now)}&dc=${Date.now()}`;

      try {
        const historyData = await httpsGet(historyUrl);
        let tracks = historyData?.data?.data || historyData?.data || [];
        const crossings = analyzeCrossingsLinear(tracks, vehicle.car_no);
        allCrossings.push(...crossings);
      } catch (err) {
        console.error(`Vehicle ${vehicle.car_no} error:`, err.message);
      }
    }

    if (allCrossings.length === 0) {
      return res.status(200).json({ success: true, message: 'Geçiş bulunamadı', updated: 0 });
    }

    // 4. Database'den Kalkış satırları
    const dbResult = await pool.query(`
      SELECT "Plaka", "Tarife_Saati", "Onaylanan", "Hareket"
      FROM public."SA65"
      WHERE "Hareket" = 'Kalkış'
      ORDER BY "Tarife_Saati"
    `);

    let updatedCount = 0;
    const details = [];

    // 5. Eşleştir ve güncelle
    for (const row of dbResult.rows) {
      if (row.Onaylanan) continue; // Zaten onaylı
      
      let bestMatch = null;
      let bestTimeDiff = Infinity;

      for (const crossing of allCrossings) {
        if (crossing.plaka !== row.Plaka) continue;

        const timeDiff = getTimeDifferenceMinutes(row.Tarife_Saati, crossing.gecis_zamani);
        if (timeDiff !== null && timeDiff <= 30 && timeDiff < bestTimeDiff) {
          bestTimeDiff = timeDiff;
          bestMatch = crossing;
        }
      }

      if (bestMatch) {
        await pool.query(`
          UPDATE public."SA65"
          SET "Onaylanan" = $1
          WHERE "Plaka" = $2 AND "Tarife_Saati" = $3 AND "Hareket" = 'Kalkış'
        `, [bestMatch.gecis_zamani, row.Plaka, row.Tarife_Saati]);

        updatedCount++;
        details.push({
          plaka: row.Plaka,
          tarife_saati: row.Tarife_Saati,
          gerceklesen: bestMatch.gecis_zamani
        });
      }
    }

    return res.status(200).json({
      success: true,
      updated: updatedCount,
      crossings: allCrossings.length,
      details: details
    });

  } catch (error) {
    console.error('VTS Quick Populate Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
