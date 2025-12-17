// Web-based VTS Runner API - Runs Python script directly
// Works from mobile and desktop browsers

export const config = {
  maxDuration: 300, // 5 minutes for script execution
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
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
    console.log('🚀 VTS Runner başlatılıyor (web-based)...');
    
    // GitHub'dan script'i çek
    const scriptUrl = 'https://raw.githubusercontent.com/cucuv007/Bus_control/main/vts_history_scraper_v2.py';
    
    const scriptResponse = await fetch(scriptUrl);
    if (!scriptResponse.ok) {
      throw new Error('Script GitHub\'dan çekilemedi');
    }
    
    let scriptContent = await scriptResponse.text();
    
    // Token'ı script içine yerleştir
    scriptContent = scriptContent.replace(
      /'access_token':\s*'[^']*'/,
      `'access_token': '${vtsToken}'`
    );
    
    console.log('✅ Token script\'e eklendi');
    
    // Python kodu çalıştırma (Node.js'te)
    // NOT: Vercel'de Python yok, bu yüzeden script'i çalıştıramayız
    // Ancak, script logic'ini JavaScript'e çevirebiliriz veya
    // external Python service kullanabiliriz
    
    // ÇÖZÜM: Script logic'ini burada JavaScript ile implement edelim
    // Veya GitHub Actions ile tetikleyelim
    
    // GitHub Actions workflow'u tetikle
    const workflowResult = await triggerGitHubAction(vtsToken);
    
    if (workflowResult.success) {
      return res.status(200).json({
        success: true,
        message: 'VTS geçişleri işleniyor...',
        summary: 'GitHub Actions workflow başlatıldı. İşlem 2-3 dakika sürecek.',
        workflowUrl: workflowResult.url
      });
    } else {
      throw new Error('GitHub Actions tetiklenemedi');
    }

  } catch (error) {
    console.error('VTS runner error:', error);
    
    // Fallback: Script'i hazırlayıp client-side execution için gönder
    return res.status(200).json({ 
      success: false,
      error: error.message,
      fallbackMode: true,
      message: 'Sunucu tarafında çalıştırılamadı. Client-side execution devreye alınıyor.',
      instructions: 'Tarayıcınız script\'i çalıştıracak (WebAssembly ile Python)'
    });
  }
}

async function triggerGitHubAction(vtsToken) {
  // GitHub Actions API ile workflow tetikleme
  // Repository secrets kullanarak token'ı gönder
  
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'cucuv007';
  const REPO_NAME = 'Bus_control';
  const WORKFLOW_FILE = 'vts-runner.yml';
  
  if (!GITHUB_TOKEN) {
    console.warn('GitHub token bulunamadı, Actions tetiklenemez');
    return { success: false };
  }
  
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            vts_token: vtsToken.substring(0, 100) // Token'ı input olarak gönder
          }
        })
      }
    );
    
    if (response.status === 204) {
      return {
        success: true,
        url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`
      };
    }
    
    return { success: false };
    
  } catch (error) {
    console.error('GitHub Actions trigger hatası:', error);
    return { success: false };
  }
}
