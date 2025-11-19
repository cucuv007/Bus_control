import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tableName, hatAdi, calismaZamani, tarife, tarifeSaati } = req.body;

    if (!tableName || !hatAdi || !calismaZamani || !tarife || !tarifeSaati) {
      return res.status(400).json({ 
        error: 'Eksik parametreler',
        received: { tableName, hatAdi, calismaZamani, tarife, tarifeSaati }
      });
    }

    // Şu anki saati al (saniye olmadan HH:MM:SS formatında)
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const approvalTime = `${hours}:${minutes}:00`; // Saniyeyi 00 olarak ekle

    console.log('Row approval request:', {
      tableName,
      hatAdi,
      calismaZamani,
      tarife,
      tarifeSaati,
      approvalTime
    });

    // İlgili satırı bul ve güncelle
    const { data, error } = await supabase
      .from(tableName)
      .update({ Onaylanan: approvalTime })
      .eq('Hat_Adi', hatAdi)
      .eq('Çalışma_Zamanı', calismaZamani)
      .eq('Tarife', tarife)
      .eq('Tarife_Saati', tarifeSaati)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'Eşleşen kayıt bulunamadı',
        criteria: { hatAdi, calismaZamani, tarife, tarifeSaati }
      });
    }

    console.log('Row approval successful:', data);

    return res.status(200).json({
      success: true,
      approvalTime,
      updatedRows: data.length,
      data: data[0]
    });

  } catch (err) {
    console.error('Row approval error:', err);
    return res.status(500).json({ error: err.message });
  }
}
