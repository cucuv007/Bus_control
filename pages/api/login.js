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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Kullanıcı adı ve şifre gerekli' 
      });
    }

    console.log('🔐 Login denemesi:', username);

    // Kullanıcıyı Kullanıcı_Verileri tablosundan getir
    const { data, error } = await supabase
      .from('Kullanıcı_Verileri')
      .select('*')
      .eq('Kullanıcı', username)
      .eq('Şifre', password)
      .single();

    if (error || !data) {
      console.error('❌ Giriş başarısız:', username);
      return res.status(401).json({ 
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı' 
      });
    }

    console.log('✅ Giriş başarılı:', username);

    return res.status(200).json({ 
      success: true,
      user: {
        Kullanıcı: data.Kullanıcı,
        Görev: data.Görev
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    return res.status(500).json({ 
      error: 'Sunucu hatası' 
    });
  }
}
