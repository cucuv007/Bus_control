import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { gorev } = req.query;

    console.log('📋 Kullanıcılar listeleniyor. Görev filtresi:', gorev || 'Tümü');

    // Filtreleme ile kullanıcıları getir
    let query = supabase
      .from('Kullanıcı_Verileri')
      .select('*')
      .order('Kullanıcı', { ascending: true });

    // Görev filtresi varsa uygula
    if (gorev && gorev !== '') {
      query = query.eq('Görev', gorev);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Listeleme hatası:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Kullanıcılar listelenirken hata oluştu: ' + error.message 
      });
    }

    console.log('✅ Kullanıcılar başarıyla listelendi. Toplam:', data.length);
    return res.status(200).json({ 
      success: true, 
      users: data 
    });

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + err.message 
    });
  }
}
