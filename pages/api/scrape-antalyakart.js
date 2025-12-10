// pages/api/scrape-antalyakart.js
// AntalyaKart web sitesinden hat ve durak bilgilerini çeker

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hat, durak } = req.query;

  try {
    console.log(`🔍 AntalyaKart scraping: Hat=${hat}, Durak=${durak}`);

    // AntalyaKart web sitesinden veri çek
    const response = await fetch('https://www.antalyakart.com.tr/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9'
      }
    });

    const html = await response.text();
    
    // HTML içinde script tag'lerini bul (genelde veri burada oluyor)
    const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gis);
    
    let apiEndpoints = [];
    let wsEndpoints = [];
    
    if (scriptMatches) {
      scriptMatches.forEach(script => {
        // API endpoint'lerini bul
        const apiMatch = script.match(/https?:\/\/[^"'\s]+api[^"'\s]*/gi);
        if (apiMatch) {
          apiEndpoints.push(...apiMatch);
        }
        
        // WebSocket endpoint'lerini bul
        const wsMatch = script.match(/wss?:\/\/[^"'\s]+/gi);
        if (wsMatch) {
          wsEndpoints.push(...wsMatch);
        }
      });
    }

    // Benzersiz endpoint'leri al
    apiEndpoints = [...new Set(apiEndpoints)];
    wsEndpoints = [...new Set(wsEndpoints)];

    console.log('📡 Bulunan API endpoints:', apiEndpoints);
    console.log('🔌 Bulunan WS endpoints:', wsEndpoints);

    // AntalyaKart mobil uygulamasının kullandığı bilinen endpoint'ler
    const knownEndpoints = {
      vehicles: [
        'https://kentkart.antalya.bel.tr/Agt/Vehicles',
        'https://kentkart.antalya.bel.tr/Agt/GetVehicles',
        'https://antalya.kentkart.com/Agt/Vehicles'
      ],
      stops: [
        'https://kentkart.antalya.bel.tr/Agt/Stops',
        'https://kentkart.antalya.bel.tr/Agt/GetStops'
      ],
      lines: [
        'https://kentkart.antalya.bel.tr/Agt/Lines',
        'https://kentkart.antalya.bel.tr/Agt/GetLines'
      ]
    };

    // Test edilecek endpoint'leri dene
    const testResults = [];
    
    for (const url of knownEndpoints.vehicles) {
      try {
        const testRes = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'AntalyaKart/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(3000)
        });
        
        testResults.push({
          url,
          status: testRes.status,
          ok: testRes.ok,
          contentType: testRes.headers.get('content-type')
        });
      } catch (err) {
        testResults.push({
          url,
          status: 0,
          ok: false,
          error: err.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      discoveredEndpoints: {
        api: apiEndpoints,
        websocket: wsEndpoints
      },
      knownEndpoints,
      testResults,
      note: 'AntalyaKart API\'leri muhtemelen auth token gerektiriyor. Mobil uygulamayı reverse engineer etmek gerekebilir.'
    });

  } catch (err) {
    console.error('Scraping error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
