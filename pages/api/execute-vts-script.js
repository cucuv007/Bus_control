// Execute VTS Script API - Pure JavaScript implementation
// Replaces Python logic with Node.js for web/mobile compatibility

// Next.js has built-in fetch, no need to import

export const config = {
  maxDuration: 300, // 5 minutes
};

// VTS API Configuration
const VTS_BASE_URL = 'https://vts.kentkart.com.tr/api/026/v1';
const START_POINT = { lat: 36.837545, lng: 30.596079 };
const DURAK = { lat: 36.830802, lng: 30.596277 };
const THRESHOLD_DISTANCE = 600; // meters

// Database configuration
const SUPABASE_URL = 'https://vhxjyfappvmtwfdkhkoc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeGp5ZmFwcHZtdHdmZGtob2MiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyODQ2ODkzMywiZXhwIjoyMDQ0MDQ0OTMzfQ.gxkYI-hHXSWLtWkQr6QJ6MCF6y8MJQVNcYfp0eFSKSc';

// Routes to process
const ROUTES = ['SA65', 'SA64', '400', '521C', 'KC06', 'KF52', 'KL08', 'KL08G', 'KM61', 'SD20', 'SD20A', 'SM62', 'UC32', 'VS18'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vtsToken } = req.body;

  if (!vtsToken) {
    return res.status(400).json({ error: 'VTS token gerekli' });
  }

  try {
    console.log('🚀 VTS Script Execution başlatıldı');
    
    const results = {
      totalRoutes: ROUTES.length,
      processedRoutes: 0,
      totalUpdates: 0,
      routeDetails: []
    };

    // Her route için işlem yap
    for (const routeCode of ROUTES) {
      try {
        console.log(`\n📍 Route işleniyor: ${routeCode}`);
        
        // Route vehicles çek
        const vehicles = await getRouteVehicles(routeCode, vtsToken);
        
        if (!vehicles || vehicles.length === 0) {
          console.log(`⚠️ ${routeCode}: Araç bulunamadı`);
          results.routeDetails.push({
            route: routeCode,
            vehicles: 0,
            crossings: 0,
            updates: 0
          });
          continue;
        }

        console.log(`✅ ${routeCode}: ${vehicles.length} araç bulundu`);
        
        let routeUpdates = 0;
        let totalCrossings = 0;

        // Her araç için geçiş kontrolü
        for (const vehicle of vehicles) {
          const plaka = vehicle.VehicleRegistration;
          
          // Son 24 saatlik history çek
          const history = await getVehicleHistory(vehicle.DeviceId, vtsToken);
          
          if (!history || history.length === 0) {
            continue;
          }

          // Geçişleri analiz et
          const crossings = analyzeCrossings(history, plaka);
          totalCrossings += crossings.length;

          // Database'i güncelle
          for (const crossing of crossings) {
            const updated = await updateDatabase(routeCode, plaka, crossing);
            if (updated) {
              routeUpdates++;
            }
          }
        }

        results.routeDetails.push({
          route: routeCode,
          vehicles: vehicles.length,
          crossings: totalCrossings,
          updates: routeUpdates
        });

        results.processedRoutes++;
        results.totalUpdates += routeUpdates;

        console.log(`✅ ${routeCode}: ${routeUpdates} güncelleme yapıldı (${totalCrossings} geçiş tespit edildi)`);

      } catch (routeError) {
        console.error(`❌ ${routeCode} hatası:`, routeError.message);
        results.routeDetails.push({
          route: routeCode,
          error: routeError.message
        });
      }
    }

    // Özet hazırla
    const summary = results.routeDetails
      .map(r => `${r.route}: ${r.updates || 0} güncelleme${r.error ? ' (HATA: ' + r.error + ')' : ''}`)
      .join('<br>');

    return res.status(200).json({
      success: true,
      message: 'VTS geçişleri başarıyla işlendi',
      summary: `<strong>Toplam: ${results.totalUpdates} güncelleme</strong><br><br>${summary}`,
      results: results
    });

  } catch (error) {
    console.error('VTS execution error:', error);
    return res.status(500).json({
      success: false,
      error: 'Script çalıştırma hatası',
      details: error.message
    });
  }
}

// VTS API: Route vehicles
async function getRouteVehicles(routeCode, token) {
  const url = `${VTS_BASE_URL}/RouteVehicles/getByRouteCode?routeCode=${routeCode}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`VTS API hatası: ${response.status}`);
  }

  const data = await response.json();
  return data.Data || [];
}

// VTS API: Vehicle history
async function getVehicleHistory(deviceId, token) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const url = `${VTS_BASE_URL}/DeviceHistories/get?deviceId=${deviceId}&from=${yesterday.toISOString()}&to=${now.toISOString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.Data || [];
}

// Geçişleri analiz et
function analyzeCrossings(history, plaka) {
  const crossings = [];
  let inGeofence = false;
  let entryTime = null;

  for (const point of history) {
    const distanceFromStart = calculateDistance(
      START_POINT.lat,
      START_POINT.lng,
      point.Lat,
      point.Lng
    );

    const distanceToDurak = calculateDistance(
      DURAK.lat,
      DURAK.lng,
      point.Lat,
      point.Lng
    );

    // Geofence'e giriş
    if (!inGeofence && distanceFromStart <= THRESHOLD_DISTANCE) {
      inGeofence = true;
      entryTime = new Date(point.DateTime);
    }

    // Geofence'ten çıkış ve DURAK'a yaklaşma
    if (inGeofence && distanceFromStart > THRESHOLD_DISTANCE && distanceToDurak < 100) {
      if (entryTime) {
        crossings.push({
          plaka: plaka,
          time: entryTime.toISOString(),
          displayTime: entryTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        });
      }
      inGeofence = false;
      entryTime = null;
    }
  }

  return crossings;
}

// Haversine distance formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Database update
async function updateDatabase(routeCode, plaka, crossing) {
  try {
    // Approve-row API endpoint'ini kullan
    const response = await fetch(`${SUPABASE_URL.replace('.supabase.co', '')}/api/approve-row`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tableName: routeCode,
        plaka: plaka,
        manualApprovalTime: crossing.time
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Database update error:', error);
    return false;
  }
}
