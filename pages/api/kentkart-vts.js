// Kentkart VTS API Proxy
// SA65 hattındaki araçların pozisyonlarını çeker

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Tüm araçları çek (SA65 filtresini response'da yapacağız)
    const apiUrl = 'https://vts.kentkart.com.tr/api/026/v1/latestdevicedata/get';
    
    const params = new URLSearchParams({
      fields: 'bus_id,date_time,lat,lon,speed,svcount,status,odometer,car_no,edge_code,bearing,route_color,direction,display_route_code,personel_name,personel_last_name,driver_code,utctime,comp_name,path_code,path_name,sam_id,tags,bus_model,fuel_type',
      sort: 'bus_id|asc',
      stationlist: '',
      dc: Date.now()
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`VTS API error: ${response.status}`);
    }

    const data = await response.json();

    // SA65 hattındaki araçları filtrele
    let sa65Vehicles = [];
    if (data && data.data) {
      sa65Vehicles = data.data.filter(vehicle => 
        vehicle.display_route_code === 'SA65' || 
        vehicle.display_route_code === 'SA-65' ||
        vehicle.path_code === 'SA65' ||
        vehicle.path_name?.includes('SA65')
      );
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      total_vehicles: data?.data?.length || 0,
      sa65_count: sa65Vehicles.length,
      vehicles: sa65Vehicles
    });

  } catch (error) {
    console.error('Kentkart VTS API error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      note: 'VTS API erişimi için authentication gerekebilir'
    });
  }
}
