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
    // Vercel'den VTS'ye proxy yap (SSL bypass ile)
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      agent: agent
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('VTS proxy error:', error);
    return res.status(500).json({ 
      error: 'VTS proxy failed', 
      details: error.message 
    });
  }
}
