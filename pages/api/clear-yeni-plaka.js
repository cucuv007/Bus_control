import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Türkiye saat dilimine göre bugünün gününü al
function getTurkeyGun() {
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    weekday: 'long'
  });
  
  const gun = formatter.format(new Date());
  
  // Türkçe gün isimlerini büyük harfe çevir
  const gunMap = {
    'pazartesi': 'PAZARTESİ',
    'salı': 'SALI',
    'çarşamba': 'ÇARŞAMBA',
    'perşembe': 'PERŞEMBE',
    'cuma': 'CUMA',
    'cumartesi': 'CUMARTESİ',
    'pazar': 'PAZAR'
  };
  
  return gunMap[gun.toLowerCase()] || gun.toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { hatlar } = req.body; // Seçili hat adları array olarak gelecek
    
    if (!hatlar || !Array.isArray(hatlar) || hatlar.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Hat listesi gereklidir' 
      });
    }

    // Bugünün gününü al
    const bugun = getTurkeyGun();
    console.log('📅 Bugünün günü:', bugun);
    console.log('🚌 Temizlenecek hatlar:', hatlar);

    // İlgili tabloda seçili hatların Yeni_Plaka sütunlarını NULL yap
    const { data, error } = await supabase
      .from(bugun)
      .update({ Yeni_Plaka: null })
      .in('Hat_Adi', hatlar)
      .select();

    if (error) {
      console.error('❌ Yeni_Plaka temizleme hatası:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Yeni_Plaka temizlenirken hata oluştu: ' + error.message,
        debugInfo: { bugun, hatlar, error }
      });
    }

    console.log(`✅ ${data?.length || 0} satırın Yeni_Plaka sütunu temizlendi (${bugun} tablosunda)`);

    return res.status(200).json({ 
      success: true, 
      message: `${data?.length || 0} satır güncellendi`,
      clearedCount: data?.length || 0,
      tableName: bugun,
      hatlar
    });

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + err.message 
    });
  }
}
