// pages/api/scrape-drive-folder.js
// Google Drive klasöründen dosyaları listele (Doğrudan link kullanarak)

const SHARED_FOLDER_ID = '10GaVA2Pe7v0AC8bv94UPgonDZVe4UdgV';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`📂 Fetching files from folder: ${SHARED_FOLDER_ID}`);

    // Yöntem 1: Google Drive API (API Key ile)
    // Bu yöntem public folder için çalışabilir
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (apiKey) {
      try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${SHARED_FOLDER_ID}'+in+parents+and+(mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'+or+mimeType='application/vnd.ms-excel')+and+trashed=false&spaces=drive&fields=files(id,name,modifiedTime,webContentLink,mimeType)&pageSize=100&orderBy=modifiedTime+desc&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.files && data.files.length > 0) {
          const filesWithLinks = data.files.map(f => ({
            id: f.id,
            name: f.name,
            modifiedTime: f.modifiedTime,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
            webContentLink: f.webContentLink,
            mimeType: f.mimeType
          }));

          console.log(`✅ Found ${filesWithLinks.length} files via API`);

          return res.status(200).json({
            success: true,
            files: filesWithLinks,
            count: filesWithLinks.length,
            method: 'api'
          });
        }
      } catch (apiErr) {
        console.log('API method failed, trying fallback...');
      }
    }

    // Yöntem 2: Fallback - Doğrudan download linklerini oluştur
    // Kullanıcı manuel olarak dosya adlarını girmeli
    console.log('📋 Using fallback method - manual file input');

    return res.status(200).json({
      success: true,
      files: [],
      count: 0,
      method: 'fallback',
      message: 'Lütfen dosya ID\'lerini manuel olarak girin veya Google API Key ekleyin',
      instructions: {
        option1: 'Google API Key ekle: GOOGLE_API_KEY environment variable',
        option2: 'Dosya ID\'lerini manuel gir (Drive linki: /d/FILE_ID/view)',
        folderUrl: `https://drive.google.com/drive/folders/${SHARED_FOLDER_ID}`
      }
    });

  } catch (err) {
    console.error('Scrape folder error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
