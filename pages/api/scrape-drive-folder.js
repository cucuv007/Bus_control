
const SHARED_FOLDER_ID = '10GaVA2Pe7v0AC8bv94UPgonDZVe4UdgV';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Google Drive'ın public API'sini kullanarak klasördeki dosyaları listele
    // API Key gereksiz - public folder için çalışır
    
    const url = `https://www.googleapis.com/drive/v3/files?q='${SHARED_FOLDER_ID}'+in+parents+and+(mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'+or+mimeType='application/vnd.ms-excel')+and+trashed=false&spaces=drive&fields=files(id,name,modifiedTime,webContentLink,mimeType)&pageSize=100&orderBy=modifiedTime+desc&key=AIzaSyDyWJHw1TSg8KqFzPhvjak_8P-VXnQrCKw`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Drive API error:', data.error);
      
      // Fallback: Alternatif yöntem - webContentLink'ten indir
      return res.status(200).json({
        success: true,
        files: [],
        message: 'Public folder erişimi sınırlı. Lütfen dosyaları manuel olarak seçiniz.',
        fallback: true
      });
    }

    const files = data.files || [];

    if (files.length === 0) {
      return res.status(200).json({
        success: true,
        files: [],
        message: 'Bu klasörde Excel dosyası bulunamadı'
      });
    }

    // Her dosya için download linki oluştur
    const filesWithLinks = files.map(f => ({
      id: f.id,
      name: f.name,
      modifiedTime: f.modifiedTime,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${f.id}`,
      webContentLink: f.webContentLink,
      mimeType: f.mimeType
    }));

    return res.status(200).json({
      success: true,
      files: filesWithLinks,
      count: filesWithLinks.length
    });

  } catch (err) {
    console.error('Scrape folder error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
