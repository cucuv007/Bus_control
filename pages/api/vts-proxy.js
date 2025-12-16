import https from 'https';
import { URL } from 'url';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, token } = req.body;

  if (!url || !token) {
    return res.status(400).json({ error: 'Missing url or token' });
  }

  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        rejectUnauthorized: false
      };

      const request = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            res.status(200).json(jsonData);
            resolve();
          } catch (parseError) {
            console.error('JSON parse error:', parseError.message, 'Data:', data.substring(0, 200));
            res.status(500).json({ 
              error: 'Invalid JSON response', 
              details: parseError.message,
              preview: data.substring(0, 200)
            });
            resolve();
          }
        });
      });

      request.on('error', (error) => {
        console.error('VTS proxy request error:', error.message);
        res.status(500).json({ 
          error: 'VTS proxy failed', 
          details: error.message 
        });
        resolve();
      });

      request.setTimeout(30000, () => {
        request.destroy();
        res.status(500).json({ error: 'Request timeout' });
        resolve();
      });

      request.end();

    } catch (error) {
      console.error('VTS proxy setup error:', error.message);
      res.status(500).json({ 
        error: 'VTS proxy setup failed', 
        details: error.message 
      });
      resolve();
    }
  });
}
