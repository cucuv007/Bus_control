// API endpoint to trigger VTS update
// Script'i indirip token ile hazırlayıp kullanıcıya sunar
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vtsToken } = req.body;

  if (!vtsToken) {
    return res.status(400).json({ error: 'VTS token gerekli' });
  }

  try {
    // GitHub'dan script'i çek
    const scriptUrl = 'https://raw.githubusercontent.com/cucuv007/Bus_control/main/vts_history_scraper_v2.py';
    
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error('Script GitHub\'dan çekilemedi');
    }
    
    let scriptContent = await response.text();
    
    // Token'ı script içine yerleştir
    scriptContent = scriptContent.replace(
      /'access_token':\s*'[^']*'/,
      `'access_token': '${vtsToken}'`
    );

    // Script'i base64 encode et (download için)
    const scriptBase64 = Buffer.from(scriptContent).toString('base64');
    
    return res.status(200).json({
      success: true,
      message: 'VTS token başarıyla eklendi. Script hazır!',
      scriptContent: scriptContent, // Direkt içerik
      scriptBase64: scriptBase64, // Download için
      tokenPreview: vtsToken.substring(0, 30) + '...',
      instructions: {
        web: 'Script otomatik olarak çalıştırılacak...',
        manual: 'Veya dosyayı indirip: python vts_history_scraper_v2.py'
      }
    });

  } catch (error) {
    console.error('VTS update error:', error);
    return res.status(500).json({ 
      error: 'VTS güncelleme hatası',
      details: error.message 
    });
  }
}
