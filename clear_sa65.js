// SA65 Onaylanan sütununu temizle
const testClear = {
  hatlar: ['SA65']
};

fetch('https://bus-control-4i5o.vercel.app/api/clear-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testClear)
})
.then(res => res.json())
.then(data => {
  console.log('Clear Response:', JSON.stringify(data, null, 2));
})
.catch(err => console.error('Error:', err));
