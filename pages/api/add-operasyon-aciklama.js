import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { Hat_Adi, Calisma_Zamani, Tarife, Tarife_Saati, Plaka, Aciklama } = req.body;

    // Validation - Sadece Hat_Adi, Tarife, Tarife_Saati ve Aciklama zorunlu
    if (!Hat_Adi || !Tarife || !Tarife_Saati || !Aciklama) {
      console.log('❌ Eksik alanlar:', { Hat_Adi, Tarife, Tarife_Saati, Aciklama });
      return res.status(400).json({ 
        success: false, 
        message: 'Hat_Adi, Tarife, Tarife_Saati ve Açıklama alanları gereklidir' 
      });
    }

    console.log('📝 Operasyon açıklaması ekleniyor:', Hat_Adi, Tarife);

    // Şu anki tarih ve saat (Supabase otomatik ekleyecek ama biz de gönderebiliriz)
    const now = new Date();

    // Açıklama ekle
    const { data, error } = await supabase
      .from('Operasyon_Açıklama')
      .insert([{
        Hat_Adi: Hat_Adi,
        'Çalışma_Zamanı': Calisma_Zamani,
        Tarife: Tarife,
        Tarife_Saati: Tarife_Saati,
        Plaka: Plaka,
        Açıklama: Aciklama,
        Tarih: now.toISOString()  // ISO format: 2025-11-26T14:30:00.000Z
      }])
      .select();

    if (error) {
      console.error('❌ Ekleme hatası:', error);
      console.error('❌ Hata detayları:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        success: false, 
        error: 'Açıklama eklenirken hata oluştu: ' + error.message,
        details: error
      });
    }

    console.log('✅ Operasyon açıklaması başarıyla eklendi');
    return res.status(200).json({ 
      success: true, 
      message: 'Açıklama başarıyla eklendi',
      data: data[0]
    });

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + err.message 
    });
  }
}
