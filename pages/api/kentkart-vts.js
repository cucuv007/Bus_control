// Kentkart VTS API Proxy - Backend'den direkt çeker
// NOT: VTS API authentication gerektiriyor, cookie/token olmadan çalışmayabilir

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // VTS API'ye direkt istek at
    const apiUrl = 'https://vts.kentkart.com.tr/api/026/v1/latestdevicedata/get';
    
    const params = new URLSearchParams({
      fields: 'bus_id,car_no,display_route_code,lat,lon,speed,status,path_name,comp_name,personel_name,personel_last_name,bearing,date_time,odometer',
      sort: 'bus_id|asc',
      stationlist: '',
      dc: Date.now()
    });

    console.log('🔄 VTS API çağrılıyor...');

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://vts.kentkart.com.tr/',
        'Origin': 'https://vts.kentkart.com.tr',
        // Cookie yoksa auth hatası verecek
      }
    });

    console.log('📡 VTS Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ VTS API Error:', errorText);
      
      // Authentication hatası ise mock data dön
      if (response.status === 401 || response.status === 403) {
        return useMockData(res);
      }
      
      throw new Error(`VTS API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ VTS data alındı:', data?.data?.data?.length || 0, 'araç');

    // SA65 filtrele
    const allVehicles = data?.data?.data || [];
    const sa65Vehicles = allVehicles.filter(vehicle => 
      vehicle.display_route_code?.includes('SA65') || 
      vehicle.display_route_code?.includes('SA-65') ||
      vehicle.path_code === 'SA65' ||
      vehicle.path_name?.includes('SA65') ||
      vehicle.path_name?.includes('SA-65')
    );

    console.log('🚌 SA65 araç sayısı:', sa65Vehicles.length);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      total_vehicles: allVehicles.length,
      sa65_count: sa65Vehicles.length,
      vehicles: sa65Vehicles,
      source: 'live'
    });

  } catch (error) {
    console.error('❌ VTS API error:', error);
    
    // Hata durumunda mock data dön
    return useMockData(res, error.message);
  }
}

// Mock data fallback
function useMockData(res, errorMsg = null) {
  console.log('⚠️ Mock data kullanılıyor');
  
  const mockSA65Vehicles = [
    {
      bus_id: 12001,
      car_no: '07MKL09',
      display_route_code: 'SA65',
      path_name: 'SARISU - TOPÇULAR - ALTINTAŞ',
      lat: 36.907342,
      lon: 30.670412,
      speed: 0,
      status: 0,
      comp_name: 'ANTOBÜS 12MT',
      date_time: new Date().toISOString(),
      bearing: 0,
      odometer: 125000
    },
    {
      bus_id: 12002,
      car_no: '07MKL43',
      display_route_code: 'SA65',
      path_name: 'SARISU - TOPÇULAR - ALTINTAŞ',
      lat: 36.908052,
      lon: 30.670243,
      speed: 0,
      status: 0,
      comp_name: 'ANTOBÜS 12MT',
      date_time: new Date().toISOString(),
      bearing: 0,
      odometer: 132000
    },
    {
      bus_id: 12003,
      car_no: '07AAU866',
      display_route_code: 'SA65',
      path_name: 'ALTINTAŞ - B.ONAT - SARISU',
      lat: 36.857171,
      lon: 30.746296,
      speed: 0,
      status: 0,
      comp_name: 'ANTOBÜS 12MT',
      date_time: new Date().toISOString(),
      bearing: 0,
      odometer: 98000
    },
    {
      bus_id: 12004,
      car_no: '07AU0108',
      display_route_code: 'SA65',
      path_name: 'ALTINTAŞ - B.ONAT - SARISU',
      lat: 36.925255,
      lon: 30.643699,
      speed: 0,
      status: 0,
      comp_name: 'S.S.21 NOLU ÖZEL HALK OTOBÜSLERİ KOOPERATİFİ',
      date_time: new Date().toISOString(),
      bearing: 0,
      odometer: 156000
    },
    {
      bus_id: 12005,
      car_no: '07AU0415',
      display_route_code: 'SA65',
      path_name: 'ALTINTAŞ - B.ONAT - SARISU',
      lat: 36.894912,
      lon: 30.706337,
      speed: 0,
      status: 0,
      comp_name: 'ANTALYA OTOBÜSÇÜLER ESNAF VE SANATKARLAR ODASI',
      date_time: new Date().toISOString(),
      bearing: 0,
      odometer: 143000
    },
    {
      bus_id: 12006,
      car_no: '07AU0338',
      display_route_code: 'SA65',
      path_name: 'SARISU - TOPÇULAR - ALTINTAŞ',
      lat: 36.830092,
      lon: 30.595812,
      speed: 0,
      status: 0,
      comp_name: 'ANTALYA OTOBÜSÇÜLER ESNAF VE SANATKARLAR ODASI',
      date_time: new Date().toISOString(),
      bearing: 0,
      odometer: 167000
    },
    {
      bus_id: 12007,
      car_no: '07AU0275',
      display_route_code: 'SA65',
      path_name: 'SARISU - TOPÇULAR - ALTINTAŞ',
      lat: 36.826824,
      lon: 30.595979,
      speed: 0,
      status: 0,
      comp_name: 'ANTALYA ESNAF ULAŞIM A.Ş.',
      date_time: new Date().toISOString(),
      bearing: 0,
      odometer: 189000
    },
    {
      bus_id: 12008,
      car_no: '07AU0028',
      display_route_code: 'SA65',
      path_name: 'SARISU - TOPÇULAR - ALTINTAŞ',
      lat: 36.886315,
      lon: 30.669876,
      speed: 19,
      status: 0,
      comp_name: 'ANTALYA OTOBÜSÇÜLER ESNAF VE SANATKARLAR ODASI',
      date_time: new Date().toISOString(),
      bearing: 45,
      odometer: 203000
    }
  ];

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    total_vehicles: 3174,
    sa65_count: mockSA65Vehicles.length,
    vehicles: mockSA65Vehicles,
    source: 'mock',
    note: errorMsg ? `VTS API erişim hatası: ${errorMsg}. Mock data kullanılıyor.` : 'VTS API authentication gerektirir. Mock data kullanılıyor.'
  });
}
