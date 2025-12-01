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
    const { username, newGorev } = req.body;

    if (!username || !newGorev) {
      console.log('❌ Eksik alanlar:', { username: !!username, newGorev: !!newGorev });
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı ve yeni görev gereklidir' 
      });
    }

    // Görev whitelist kontrolü
    const validGorevs = ['Admin', 'Operasyon', 'Rotasyon', 'Depolama', 'Otobüs_Şoförü', 'User'];
    if (!validGorevs.includes(newGorev)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçersiz görev seçimi' 
      });
    }

    console.log('✏️ Kullanıcı görevi güncelleniyor:', username, '→', newGorev);

    // Kullanıcı var mı kontrol et
    const { data: existingUser, error: checkError } = await supabase
      .from('Kullanıcı_Verileri')
      .select('*')
      .eq('Kullanıcı', username)
      .single();

    if (checkError || !existingUser) {
      console.log('❌ Kullanıcı bulunamadı:', username);
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    // Görevi güncelle
    const { data, error } = await supabase
      .from('Kullanıcı_Verileri')
      .update({ Görev: newGorev })
      .eq('Kullanıcı', username)
      .select();

    if (error) {
      console.error('❌ Güncelleme hatası:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Görev güncellenirken hata oluştu: ' + error.message 
      });
    }

    console.log('✅ Kullanıcı görevi başarıyla güncellendi:', username);
    
    // Görev değiştiğinde kullanıcıyı logout yap (session invalidation)
    // Frontend'de bu değişikliği algılamak için timestamp döndür
    const logoutTimestamp = new Date().toISOString();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Kullanıcı görevi başarıyla güncellendi. Kullanıcı yeniden giriş yapmalıdır.',
      user: data[0],
      forceLogout: true,
      logoutUsername: username,
      logoutTimestamp
    });

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + err.message 
    });
  }
}
