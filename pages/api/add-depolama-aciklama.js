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

    // Validation
    if (!Hat_Adi || !Calisma_Zamani || !Tarife || !Tarife_Saati || !Plaka || !Aciklama) {
      console.log('❌ Eksik alanlar');
      return res.status(400).json({ 
        success: false, 
        message: 'Tüm alanlar gereklidir' 
      });
    }

    console.log('📝 Depolama açıklaması ekleniyor:', Hat_Adi, Tarife);

    // Açıklama ekle
    const { data, error } = await supabase
      .from('Depolama_Açıklama')
      .insert([{
        Hat_Adi: Hat_Adi,
        'Çalışma_Zamanı': Calisma_Zamani,
        Tarife: Tarife,
        Tarife_Saati: Tarife_Saati,
        Plaka: Plaka,
        Açıklama: Aciklama
      }])
      .select();

    if (error) {
      console.error('❌ Ekleme hatası:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Açıklama eklenirken hata oluştu: ' + error.message 
      });
    }

    console.log('✅ Depolama açıklaması başarıyla eklendi');
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
