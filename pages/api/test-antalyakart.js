// pages/api/test-antalyakart.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = {
    timestamp: new Date().toISOString(),
    restAPI: [],
    wsAPI: []
  };

  // Test edilecek REST endpoint'ler
  const restEndpoints = [
    'https://api.antalyakart.com.tr/MobileApi/GetBusPositions',
    'https://realtime.antalyakart.com.tr/api/vehicles',
    'https://realtime.antalyakart.com.tr/bus/positions',
    'https://antalyakart.com.tr/api/bus/realtime',
    'https://api.antalyakart.com.tr/api/v1/vehicles',
    'https://www.antalyakart.com.tr/api/bus/live'
  ];

  console.log('🔍 AntalyaKart API Test başlıyor...');

  // REST API testleri
  for (const url of restEndpoints) {
    try {
      console.log(`Testing REST: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin': 'https://www.antalyakart.com.tr',
          'Referer': 'https://www.antalyakart.com.tr/'
        }
      });
      
      clearTimeout(timeoutId);
      
      const status = response.status;
      const contentType = response.headers.get('content-type');
      
      let data = null;
      let error = null;
      
      if (response.ok) {
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (e) {
          error = 'JSON parse hatası: ' + e.message;
        }
      }
      
      results.restAPI.push({
        url,
        status,
        contentType,
        success: response.ok,
        dataLength: data ? JSON.stringify(data).length : 0,
        sampleData: data ? JSON.stringify(data).slice(0, 300) : null,
        error
      });
      
      console.log(`✅ ${url} - Status: ${status}`);
      
    } catch (err) {
      console.log(`❌ ${url} - Error: ${err.message}`);
      results.restAPI.push({
        url,
        status: 0,
        success: false,
        error: err.message
      });
    }
  }

  // WebSocket bilgisi (server-side WS test edilemez, client-side gerekir)
  results.wsAPI = [
    {
      url: 'wss://realtime.antalyakart.com.tr/bus/stream',
      note: 'Browser tarafında test edilmeli (WebSocket client gerekli)'
    },
    {
      url: 'wss://realtime.antalyakart.com.tr/ws',
      note: 'Browser tarafında test edilmeli (WebSocket client gerekli)'
    },
    {
      url: 'wss://api.antalyakart.com.tr/ws/bus',
      note: 'Browser tarafında test edilmeli (WebSocket client gerekli)'
    }
  ];

  console.log('✅ Test tamamlandı');

  return res.status(200).json(results);
}
