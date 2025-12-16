// VTS işlemini tetikle, hemen dön (background)
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Hemen response dön
  res.status(200).json({
    success: true,
    message: 'VTS işlemi başlatıldı (arka planda devam ediyor)',
    status: 'processing'
  });

  // Arka planda çalışmaya devam et
  try {
    // Python script'i tetikle (webhook ile)
    const webhookUrl = process.env.VTS_WEBHOOK_URL;
    
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vts_populate',
          hat: 'SA65',
          timestamp: new Date().toISOString()
        })
      });
    } else {
      console.log('VTS webhook URL not configured');
    }
  } catch (error) {
    console.error('Background VTS trigger error:', error);
  }
}
