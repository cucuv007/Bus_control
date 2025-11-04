// pages/api/test.js
// API'nin çalışıp çalışmadığını test et

export default async function handler(req, res) {
  console.log('Test endpoint called');
  
  return res.status(200).json({
    success: true,
    message: 'API çalışıyor',
    timestamp: new Date().toISOString(),
    method: req.method,
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGoogleApiKey: !!process.env.GOOGLE_API_KEY
    }
  });
}
