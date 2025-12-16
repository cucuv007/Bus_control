// test_vts_auto_populate.js
// VTS otomatik onaylama sistemini test eder

const VTS_BASE_URL = "https://vts.kentkart.com.tr/api/026/v1";
const VTS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjM1MTIsImF1ZCI6IjMiLCJleHAiOjE3NjU5NTA2NTQsIm5iZiI6MTc2NTc3Nzg1NCwiaWF0IjoxNzY1Nzc3ODU0LCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRrIiwiYjNBNFZUUyJdLCJleHQiOm51bGwsImlzU3VwZXJBZG1pbiI6MCwiaXAiOiIxMC4wLjQwLjgiLCJsb2dpbm1ldGhvZCI6bnVsbCwiYWNjcm9sZSI6bnVsbCwicm9sZSI6WyJ2dHNhZG1pbiJdLCJuZXRzIjpbeyJOSUQiOiIwMjYiLCJEIjoiMSIsIk5BTUUiOiJBTlRBTFlBIn1dLCJsYW5nIjoidHIiLCJ1c2VybmFtZSI6InVndXIueWlsbWF6Iiwic2lkIjo1MTEwNTgyfQ.Z37r5Lssp5Lbed8zf4QY3-Eccj8F0Ydg9rnTHfd7386p3AROgOAaj1VgAT9n-Zhi3TWWtVyWAS2HbA_xVgCB07HmHJ-o_MxrBQslEXRk-vaEJaefF0XtcqQwuZtTShevMFO8TdtkObAZPbYhdZ4a-t3GeIKxSVO25u0rzlaOuAAU5qCF4qFz1Hteqs5rkesdgpHkVYzqrG448Mo7PwpsLhj-pM0Fv81jptVEnYurkWFCenlJtUOHDO89GlhBwLKAGOIuseybkqm1QunsHzUVduaNAyzxioZauv25qinUY_5WA-MVVn2l5K9adqj42RWMSoPmecXV-3b7C9ohRnaq5A';

async function testVTSConnection() {
  console.log('\n' + '='.repeat(70));
  console.log('VTS AUTO-POPULATE TEST');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Test 1: SA65 Araçlarını Çek
    console.log('📡 Test 1: SA65 araçlarını çekme...');
    const url = `${VTS_BASE_URL}/latestdevicedata/get`;
    const params = new URLSearchParams({
      fields: 'bus_id,car_no,display_route_code',
      sort: 'bus_id|asc',
      dc: Date.now()
    });
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${VTS_TOKEN}`,
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`VTS API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    let vehicles = [];
    if (data?.data?.data) {
      vehicles = data.data.data;
    } else if (data?.data && Array.isArray(data.data)) {
      vehicles = data.data;
    }
    
    const sa65List = vehicles.filter(v => v.display_route_code === 'SA65');
    
    console.log(`✅ ${sa65List.length} SA65 aracı bulundu:`);
    sa65List.forEach(v => {
      console.log(`   - ${v.car_no} (bus_id: ${v.bus_id})`);
    });
    
    if (sa65List.length === 0) {
      console.log('⚠️  SA65 araçları bulunamadı, test durduruluyor.');
      return;
    }
    
    // Test 2: İlk Araç İçin Geçmiş Veri Çek
    console.log('\n📡 Test 2: Geçmiş veri çekme...');
    const firstVehicle = sa65List[0];
    
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
    
    const formatTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };
    
    const historyUrl = `${VTS_BASE_URL}/historicdevicedata/get`;
    const historyParams = new URLSearchParams({
      fields: 'date_time,lat,lon,speed,car_no,bus_id',
      filters: '',
      sort: 'date_time|asc',
      bus_list: firstVehicle.bus_id,
      start_date_time: formatTime(startTime),
      end_date_time: formatTime(now),
      dc: Date.now()
    });
    
    console.log(`   Araç: ${firstVehicle.car_no}`);
    console.log(`   Zaman: ${startTime.toLocaleTimeString('tr-TR')} - ${now.toLocaleTimeString('tr-TR')}`);
    
    const historyResponse = await fetch(`${historyUrl}?${historyParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${VTS_TOKEN}`,
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!historyResponse.ok) {
      throw new Error(`History API error: ${historyResponse.status}`);
    }
    
    const historyData = await historyResponse.json();
    
    let tracks = [];
    if (historyData?.data?.data) {
      tracks = historyData.data.data;
    } else if (historyData?.data && Array.isArray(historyData.data)) {
      tracks = historyData.data;
    }
    
    console.log(`✅ ${tracks.length} konum noktası alındı`);
    
    if (tracks.length > 0) {
      console.log(`   İlk nokta: ${tracks[0].date_time} (${tracks[0].lat}, ${tracks[0].lon})`);
      console.log(`   Son nokta: ${tracks[tracks.length-1].date_time} (${tracks[tracks.length-1].lat}, ${tracks[tracks.length-1].lon})`);
    }
    
    // Test 3: API Endpoint'i Çağır
    console.log('\n📡 Test 3: API endpoint testi...');
    console.log('   URL: http://localhost:3000/api/vts-auto-populate-onaylanan');
    console.log('   ⚠️  Not: Bu test sadece lokal sunucu çalışıyorsa başarılı olur');
    console.log('   ⚠️  Vercel üzerinde test için production URL\'i kullanın');
    
    try {
      const apiResponse = await fetch('http://localhost:3000/api/vts-auto-populate-onaylanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hat: 'SA65' })
      });
      
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('✅ API çağrısı başarılı:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`⚠️  API yanıt kodu: ${apiResponse.status}`);
      }
    } catch (apiError) {
      console.log('⚠️  Lokal sunucu çalışmıyor, test atlanıyor');
      console.log('   Sunucuyu başlatmak için: npm run dev');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST TAMAMLANDI');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ TEST HATASI:', error.message);
    console.error('\nDetay:', error);
    
    if (error.message.includes('401')) {
      console.log('\n⚠️  Token süresi dolmuş olabilir. Yeni token almak için:');
      console.log('   1. https://vts.kentkart.com.tr adresine gidin');
      console.log('   2. F12 → Application → Cookies');
      console.log('   3. access_token değerini kopyalayın');
    }
  }
}

// Test'i çalıştır
testVTSConnection();
