// pages/api/get-sa64-vehicles.js
// SA64 hattındaki araçların konumlarını çeker

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚌 SA64 hattı araçları aranıyor...');

    // AntalyaKart'ın muhtemel API endpoint'leri
    const endpoints = [
      {
        url: 'https://www.antalyakart.com.tr/ulasim/agt',
        method: 'GET'
      },
      {
        url: 'https://kentkart.antalya.bel.tr/api/agt/vehicles',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AntalyaKart/1.0'
        }
      }
    ];

    const results = [];

    // Her endpoint'i dene
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(endpoint.url, {
          method: endpoint.method || 'GET',
          signal: controller.signal,
          headers: endpoint.headers || {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            results.push({
              endpoint: endpoint.url,
              status: response.status,
              data
            });
          } else {
            const html = await response.text();
            
            // HTML içinde JSON data ara
            const jsonMatch = html.match(/var\s+vehicles\s*=\s*(\[.*?\]);/s) ||
                            html.match(/var\s+busData\s*=\s*(\{.*?\});/s) ||
                            html.match(/"vehicles":\s*(\[.*?\])/s);
            
            if (jsonMatch) {
              try {
                const jsonData = JSON.parse(jsonMatch[1]);
                results.push({
                  endpoint: endpoint.url,
                  status: response.status,
                  data: jsonData,
                  source: 'HTML embedded JSON'
                });
              } catch (e) {
                // JSON parse hatası
              }
            }
            
            results.push({
              endpoint: endpoint.url,
              status: response.status,
              htmlLength: html.length,
              hasVehicleKeyword: html.includes('vehicle') || html.includes('araç'),
              hasSA64: html.includes('SA64') || html.includes('sa64')
            });
          }
        }
      } catch (err) {
        results.push({
          endpoint: endpoint.url,
          error: err.message
        });
      }
    }

    // Şimdilik mock data döndür (gerçek API bulunana kadar)
    const mockVehicles = [
      {
        hat: 'SA64',
        plaka: '07EM435',
        lat: 36.861924,
        lon: 30.602911,
        hiz: 0,
        durak: '13001',
        durakMesafe: 5,
        sonGuncelleme: new Date().toISOString(),
        durum: 'Durağa yakın'
      },
      {
        hat: 'SA64',
        plaka: '07AB123',
        lat: 36.8850,
        lon: 30.7050,
        hiz: 45,
        durak: null,
        durakMesafe: null,
        sonGuncelleme: new Date().toISOString(),
        durum: 'Hatta'
      }
    ];

    return res.status(200).json({
      success: true,
      vehicles: mockVehicles,
      apiResults: results,
      note: 'AntalyaKart API\'leri henüz bulunamadı. Şimdilik mock data gösteriliyor.',
      recommendation: 'AntalyaKart mobil uygulamasını reverse engineer etmek veya Chrome DevTools ile network trafiğini analiz etmek gerekiyor.'
    });

  } catch (err) {
    console.error('Get SA64 vehicles error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
