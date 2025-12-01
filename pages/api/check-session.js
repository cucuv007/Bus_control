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
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı gereklidir' 
      });
    }

    // Kullanıcının güncel bilgilerini getir
    const { data, error } = await supabase
      .from('Kullanıcı_Verileri')
      .select('Kullanıcı, Görev')
      .eq('Kullanıcı', username)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı',
        sessionValid: false
      });
    }

    return res.status(200).json({ 
      success: true,
      sessionValid: true,
      user: {
        Kullanıcı: data.Kullanıcı,
        Görev: data.Görev
      }
    });

  } catch (err) {
    console.error('❌ Session check error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
}
