// pages/api/scrape-drive-folder.js
// Google Drive klasöründen dosyaları listele

const SHARED_FOLDER_ID = '10GaVA2Pe7v0AC8bv94UPgonDZVe4UdgV';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📂 Starting scrape-drive-folder...');
    console.log('GOOGLE_API_KEY exists:', !!process.env.GOOGLE_API_KEY);
    console.log('GOOGLE_API_KEY length:', process.env.GOOGLE_API_KEY?.length || 0);

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.log('❌ No API Key found');
      return res.status(200).json({
        success: false,
        files: [],
        method: 'no_key',
        message: 'Google API Key tanımlı değil. Lütfen Vercel Environment Variables\'a ekleyin.',
        instructions: {
          step1: 'Vercel Dashboard → Settings → Environment Variables',
          step2: 'GOOGLE_API_KEY ekle',
          step3: 'Redeploy et'
        }
      });
    }

    console.log(`🔑 Using API Key: ${apiKey.substring(0, 10)}...`);

    // Google Drive API'ye istek yap
    const query = `'${SHARED_FOLDER_ID}' in parents and (mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel') and trashed=false`;
    
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.append('q', query);
    url.searchParams.append('spaces', 'drive');
    url.searchParams.append('fields', 'files(id,name,modifiedTime,webContentLink,mimeType)');
    url.searchParams.append('pageSize', '100');
    url.searchParams.append('orderBy', 'modifiedTime desc');
    url.searchParams.append('key', apiKey);

    console.log('📡 Calling Google Drive API...');
    console.log('URL:', url.toString().replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('📊 API Response Status:', response.status);

    const data = await response.json();

    console.log('📋 API Response:', JSON.stringify(data).substring(0, 200));

    if (!response.ok) {
      console.error('❌ API Error:', data);
      
      if (data.error?.code === 403) {
        return res.status(200).json({
          success: false,
          files: [],
          method: 'api_error',
          message: 'Google API Key geçersiz veya izin yok. Lütfen kontrol et.',
          error: data.error.message
        });
      }

      if (data.error?.code === 401) {
        return res.status(200).json({
          success: false,
          files: [],
          method: 'api_error',
          message: 'Google API Key geçersiz. Lütfen yeni bir key oluştur.',
          error: data.error.message
        });
      }

      throw new Error(data.error?.message || 'API Error');
    }

    const files = data.files || [];

    console.log(`✅ Found ${files.length} files`);

    if (files.length === 0) {
      return res.status(200).json({
        success: true,
        files: [],
        count: 0,
        message: 'Bu klasörde Excel dosyası bulunamadı'
      });
    }

    // Dosyaları işle
    const filesWithLinks = files.map(f => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
      webContentLink: f.webContentLink,
      mimeType: f.mimeType
    }));

    console.log('📤 Returning files:', filesWithLinks.map(f => f.name));

    return res.status(200).json({
      success: true,
      files: filesWithLinks,
      count: filesWithLinks.length,
      method: 'api'
    });

  } catch (err) {
    console.error('❌ Scrape folder error:', err);
    return res.status(500).json({ 
      error: 'Hata: ' + err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
