// AntalyaKart API test scripti
import fetch from 'node-fetch';
import WebSocket from 'ws';

// Test edilecek endpoint'ler
const ENDPOINTS = [
  'https://api.antalyakart.com.tr/MobileApi/GetBusPositions',
  'https://realtime.antalyakart.com.tr/api/vehicles',
  'https://realtime.antalyakart.com.tr/bus/positions',
  'https://antalyakart.com.tr/api/bus/realtime'
];

const WS_ENDPOINTS = [
  'wss://realtime.antalyakart.com.tr/bus/stream',
  'wss://realtime.antalyakart.com.tr/ws',
  'wss://api.antalyakart.com.tr/ws/bus'
];

console.log('🔍 AntalyaKart API Test Başlıyor...\n');

// REST API test
async function testRestAPI() {
  console.log('📡 REST API Test:\n');
  
  for (const url of ENDPOINTS) {
    try {
      console.log(`Testing: ${url}`);
      const res = await fetch(url, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${res.status}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Başarılı! Veri uzunluğu: ${JSON.stringify(data).length}`);
        console.log(`Örnek veri:`, JSON.stringify(data).slice(0, 500));
      }
    } catch (err) {
      console.log(`❌ Hata: ${err.message}`);
    }
    console.log('---\n');
  }
}

// WebSocket test
async function testWebSocket() {
  console.log('\n🔌 WebSocket Test:\n');
  
  for (const url of WS_ENDPOINTS) {
    await new Promise((resolve) => {
      try {
        console.log(`Testing: ${url}`);
        const ws = new WebSocket(url);
        
        const timeout = setTimeout(() => {
          console.log(`❌ Timeout - bağlantı kurulamadı`);
          ws.close();
          resolve();
        }, 5000);
        
        ws.on('open', () => {
          console.log(`✅ Bağlantı kuruldu!`);
          clearTimeout(timeout);
          
          // Örnek mesaj gönder
          try {
            ws.send(JSON.stringify({ type: 'subscribe', channels: ['vehicles'] }));
          } catch (e) { }
        });
        
        ws.on('message', (data) => {
          console.log(`📨 Mesaj alındı:`, data.toString().slice(0, 500));
          ws.close();
          clearTimeout(timeout);
          resolve();
        });
        
        ws.on('error', (err) => {
          console.log(`❌ Hata: ${err.message}`);
          clearTimeout(timeout);
          resolve();
        });
        
        ws.on('close', () => {
          console.log(`🔌 Bağlantı kapatıldı`);
          clearTimeout(timeout);
          resolve();
        });
      } catch (err) {
        console.log(`❌ Hata: ${err.message}`);
        resolve();
      }
      console.log('---\n');
    });
  }
}

// Ana test fonksiyonu
async function runTests() {
  await testRestAPI();
  await testWebSocket();
  console.log('\n✅ Testler tamamlandı!');
  process.exit(0);
}

runTests();
