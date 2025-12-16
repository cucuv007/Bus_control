const https = require('https');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, token } = req.body;

  if (!url || !token) {
    return res.status(400).json({ error: 'Missing url or token' });
  }

  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      rejectUnauthorized: false
    };

    https.get(url, options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          res.status(200).json(jsonData);
          resolve();
        } catch (error) {
          console.error('JSON parse error:', error);
          res.status(500).json({ error: 'Invalid JSON response', details: error.message });
          resolve();
        }
      });
    }).on('error', (error) => {
      console.error('VTS proxy error:', error);
      res.status(500).json({ error: 'VTS proxy failed', details: error.message });
      resolve();
    });
  });
}
