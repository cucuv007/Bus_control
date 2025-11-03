export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID gerekli' });
    }

    // Google Drive'dan dosyayı indir
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    console.log(`📥 Downloading file: ${fileId}`);

    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error('Download error:', response.status, response.statusText);
      return res.status(500).json({ 
        error: 'Dosya indirilemedi: ' + response.statusText 
      });
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    console.log(`✅ File downloaded: ${buffer.byteLength} bytes`);

    return res.status(200).json({
      success: true,
      data: base64,
      size: buffer.byteLength
    });

  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
