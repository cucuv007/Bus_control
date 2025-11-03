const SHARED_FOLDER_ID = '10GaVA2Pe7v0AC8bv94UPgonDZVe4UdgV';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📂 Fetching files from Google Drive...');
    
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.log('❌ GOOGLE_API_KEY not found');
      return res.status(200).json({
        success: false,
        files: [],
        message: 'Google API Key tanımlı değil. Manuel yükleme kullanın.',
        needsApiKey: true
      });
    }

    console.log(`🔑 API Key found: ${apiKey.substring(0, 10)}...`);

    // Google Drive API v3 kullan
    const query = `'${SHARED_FOLDER_ID}' in parents and (mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel') and trashed=false`;
    
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size)&pageSize=100&orderBy=modifiedTime desc&key=${apiKey}`;

    console.log('📡 API URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      
      return res.status(200).json({
        success: false,
        files: [],
        message: `Google Drive API hatası: ${errorData.error?.message || 'Bilinmeyen hata'}`,
        error: errorData.error,
        needsApiKey: errorData.error?.code === 403 || errorData.error?.code === 401
      });
    }

    const data = await response.json();
    const files = data.files || [];

    console.log(`✅ Found ${files.length} files:`, files.map(f => f.name));

    if (files.length === 0) {
      return res.status(200).json({
        success: false,
        files: [],
        message: 'Bu klasörde Excel dosyası bulunamadı. Klasörün public olduğundan emin olun.'
      });
    }

    const filesWithDownloadUrl = files.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      modifiedTime: f.modifiedTime,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`
    }));

    return res.status(200).json({
      success: true,
      files: filesWithDownloadUrl,
      count: filesWithDownloadUrl.length
    });

  } catch (err) {
    console.error('❌ Error:', err);
    return res.status(200).json({
      success: false,
      files: [],
      error: err.message,
      message: 'Bir hata oluştu. Manuel yükleme kullanın.'
    });
  }
}
