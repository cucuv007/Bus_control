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
    const { username } = req.body;

    if (!username) {
      console.log('❌ Kullanıcı adı eksik');
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı gereklidir' 
      });
    }

    console.log('🗑️ Kullanıcı siliniyor:', username);

    // Kullanıcıyı sil
    const { data, error } = await supabase
      .from('Kullanıcı_Verileri')
      .delete()
      .eq('Kullanıcı', username)
      .select();

    if (error) {
      console.error('❌ Silme hatası:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Kullanıcı silinirken hata oluştu: ' + error.message 
      });
    }

    if (!data || data.length === 0) {
      console.log('❌ Kullanıcı bulunamadı:', username);
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    console.log('✅ Kullanıcı başarıyla silindi:', username);
    return res.status(200).json({ 
      success: true, 
      message: 'Kullanıcı başarıyla silindi'
    });

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + err.message 
    });
  }
}
