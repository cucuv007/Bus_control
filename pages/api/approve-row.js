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
    const { tableName, hatAdi, calismaZamani, tarife, tarifeSaati, hareket, manualApprovalTime } = req.body;

    if (!tableName || !hatAdi || !tarife || !tarifeSaati) {
      return res.status(400).json({ 
        error: 'Eksik parametreler',
        received: { tableName, hatAdi, calismaZamani, tarife, tarifeSaati, hareket }
      });
    }

    // Manuel zaman verilmişse onu kullan, yoksa mevcut saat
    let approvalTime;
    if (manualApprovalTime) {
      approvalTime = manualApprovalTime;
    } else {
      // Türkiye saatini al (UTC+3)
      const now = new Date();
      const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
      const hours = String(turkeyTime.getHours()).padStart(2, '0');
      const minutes = String(turkeyTime.getMinutes()).padStart(2, '0');
      approvalTime = `${hours}:${minutes}:00`; // Saniyeyi 00 olarak ekle
    }

    console.log('Row approval request:', {
      tableName,
      hatAdi,
      calismaZamani,
      tarife,
      tarifeSaati,
      hareket,
      approvalTime
    });

    // İlgili satırı bul ve güncelle - Hareket ile beraber
    let query = supabase
      .from(tableName)
      .update({ Onaylanan: approvalTime })
      .eq('Hat_Adi', hatAdi)
      .eq('Tarife', tarife)
      .eq('Tarife_Saati', tarifeSaati);
    
    // Çalışma_Zamanı varsa ekle
    if (calismaZamani) {
      query = query.eq('Çalışma_Zamanı', calismaZamani);
    }
    
    // Hareket varsa ekle
    if (hareket) {
      query = query.eq('Hareket', hareket);
    }
    
    const { data, error } = await query.select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        error: 'Eşleşen kayıt bulunamadı',
        criteria: { tableName, hatAdi, calismaZamani, tarife, tarifeSaati, hareket },
        hint: 'Lütfen Hat_Adi, Tarife, Tarife_Saati, Hareket değerlerini kontrol edin'
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
