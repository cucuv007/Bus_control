// Kentkart VTS API Proxy
// SA65 hattındaki araçların pozisyonlarını çeker
// NOT: VTS API authentication gerektiriyor, bu proxy auth header'ları iletmez

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock data - Gerçek VTS API auth gerektirdiği için
    // Console'dan aldığımız SA65 araçları
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
        date_time: new Date().toISOString()
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
        date_time: new Date().toISOString()
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
        date_time: new Date().toISOString()
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
        date_time: new Date().toISOString()
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
        date_time: new Date().toISOString()
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
        date_time: new Date().toISOString()
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
        date_time: new Date().toISOString()
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
        date_time: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      total_vehicles: 3174,
      sa65_count: mockSA65Vehicles.length,
      vehicles: mockSA65Vehicles,
      note: 'Mock data - VTS API authentication gerektirir. Gerçek veri için VTS console kullanın.'
    });

  } catch (error) {
    console.error('Kentkart VTS API error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
}
