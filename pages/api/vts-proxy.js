import axios from 'axios';
import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, token } = req.body;

  if (!url || !token) {
    return res.status(400).json({ error: 'Missing url or token' });
  }

  try {
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      httpsAgent: agent,
      timeout: 30000
    });

    return res.status(200).json(response.data);

  } catch (error) {
    console.error('VTS proxy error:', error.message);
    return res.status(500).json({ 
      error: 'VTS proxy failed', 
      details: error.message,
      url: url.substring(0, 100)
    });
  }
}
