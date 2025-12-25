// Test vts-process-crossings API
const testData = {
  crossings: [
    { plaka: '07AU0274', gecis_zamani: '06:52:10', min_mesafe: 11.2 },
    { plaka: '07AU0337', gecis_zamani: '07:29:00', min_mesafe: 10.5 },
    { plaka: '07AU0414', gecis_zamani: '07:40:55', min_mesafe: 24.2 }
  ],
  hat: 'SA65'
};

fetch('https://bus-control-4i5o.vercel.app/api/vts-process-crossings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('API Response:', JSON.stringify(data, null, 2));
})
.catch(err => console.error('Error:', err));
