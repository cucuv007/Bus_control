// VTS Push Data Receiver
// Python script'ten gelen gerçek zamanlı VTS verilerini alır

let latestVTSData = null;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: Python script'ten veri al
  if (req.method === 'POST') {
    try {
      const { timestamp, vehicles, count, gecisler } = req.body;

      if (!vehicles || !Array.isArray(vehicles)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // Global değişkene kaydet
      latestVTSData = {
        timestamp,
        vehicles,
        count,
        total: vehicles.length,
        gecisler: gecisler || [],
        gecis_count: gecisler ? gecisler.length : 0,
        source: 'live-push',
        received_at: new Date().toISOString()
      };

      console.log(`✅ VTS data received: ${count} vehicles, ${latestVTSData.gecis_count} crossings at ${timestamp}`);

      return res.status(200).json({
        success: true,
        message: 'Data received',
        count,
        gecis_count: latestVTSData.gecis_count
      });

    } catch (error) {
      console.error('❌ POST error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // GET: Frontend'den veri isteği
  if (req.method === 'GET') {
    try {
      if (!latestVTSData) {
        return res.status(200).json({
          success: false,
          message: 'No data available yet. Python pusher running?',
          timestamp: new Date().toISOString()
        });
      }

      // 30 saniyeden eski mi kontrol et
      const dataAge = Date.now() - new Date(latestVTSData.timestamp).getTime();
      const isStale = dataAge > 30000; // 30 saniye

      return res.status(200).json({
        success: true,
        ...latestVTSData,
        age_seconds: Math.floor(dataAge / 1000),
        is_stale: isStale
      });

    } catch (error) {
      console.error('❌ GET error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
