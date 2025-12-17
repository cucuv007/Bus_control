// API endpoint to run VTS scraper with token
// Receives token, updates Python script, and executes it

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export const config = {
  maxDuration: 300, // 5 minutes max for script execution
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
    console.log('🚀 VTS scraper başlatılıyor...');
    console.log('Token preview:', vtsToken.substring(0, 30) + '...');

    // Python script'in yolunu bul
    const scriptPath = path.join(process.cwd(), 'vts_history_scraper_v2.py');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error('vts_history_scraper_v2.py bulunamadı');
    }

    // Token'ı script'e yaz
    let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    
    // Token'ı değiştir
    const tokenPattern = /'access_token':\s*'[^']*'/;
    scriptContent = scriptContent.replace(tokenPattern, `'access_token': '${vtsToken}'`);
    
    // Güncellenmiş script'i geçici dosyaya yaz
    const tempScriptPath = path.join(process.cwd(), 'temp_vts_scraper.py');
    fs.writeFileSync(tempScriptPath, scriptContent, 'utf-8');

    console.log('✅ Token script\'e yazıldı');

    // Python script'i çalıştır (Vercel'de çalışmaz ama deneyebiliriz)
    // NOT: Bu Vercel'de çalışmayacak çünkü Python yok
    // Alternatif: Script'i indirilebilir hale getir ve kullanıcı manuel çalıştırsın
    
    // Vercel'de Python çalıştıramayız, bu yüzden kullanıcıya script'i veriyoruz
    console.log('⚠️ Vercel\'de Python çalıştırılamıyor');
    
    // Script içeriğini base64 encode et
    const scriptBase64 = Buffer.from(scriptContent).toString('base64');
    
    // Kullanıcıya script'i ver
    return res.status(200).json({
      success: true,
      message: 'VTS token başarıyla eklendi. Script\'i indirip çalıştırın.',
      scriptBase64: scriptBase64,
      instructions: {
        download: 'Script\'i indirin: vts_history_scraper_v2.py',
        run: 'Terminal\'den çalıştırın: python vts_history_scraper_v2.py',
        routes: '14 hat işlenecek: SA65, SA64, 400, 521C, KC06, KF52, KL08, KL08G, KM61, SD20, SD20A, SM62, UC32, VS18'
      },
      tokenPreview: vtsToken.substring(0, 30) + '...',
      needsManualExecution: true,
      downloadUrl: `/api/download-vts-script?token=${vtsToken.substring(0, 20)}`
    });

  } catch (error) {
    console.error('VTS scraper error:', error);
    return res.status(500).json({ 
      error: 'VTS scraper hatası',
      details: error.message,
      note: 'Vercel\'de Python çalıştırılamıyor. Script\'i manuel indirip çalıştırmanız gerekiyor.'
    });
  }
}
