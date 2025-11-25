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
    const { username, password, gorev } = req.body;

    if (!username || !password || !gorev) {
      return res.status(400).json({ 
        error: 'Kullanıcı adı, şifre ve görev gerekli' 
      });
    }

    // Geçerli görevler listesi
    const validGorevler = ['Admin', 'Operasyon', 'Rotasyon', 'Depolama', 'Otobüs_Şoförü', 'User'];
    
    if (!validGorevler.includes(gorev)) {
      return res.status(400).json({ 
        error: 'Geçersiz görev. İzin verilen: ' + validGorevler.join(', ')
      });
    }

    console.log('👤 Yeni kullanıcı ekleniyor:', username, '- Görev:', gorev);

    // Kullanıcı adı zaten var mı kontrol et
    const { data: existing, error: checkError } = await supabase
      .from('Kullanıcı_Verileri')
      .select('Kullanıcı')
      .eq('Kullanıcı', username)
      .single();

    if (existing) {
      console.error('❌ Bu kullanıcı adı zaten mevcut:', username);
      return res.status(409).json({ 
        error: 'Bu kullanıcı adı zaten mevcut. Lütfen farklı bir kullanıcı adı seçin.' 
      });
    }

    // Yeni kullanıcı ekle
    const { data, error } = await supabase
      .from('Kullanıcı_Verileri')
      .insert([
        {
          Kullanıcı: username,
          Şifre: password,
          Görev: gorev
        }
      ])
      .select();

    if (error) {
      console.error('❌ Supabase insert hatası:', error);
      return res.status(500).json({ 
        error: 'Kullanıcı eklenemedi', 
        details: error.message 
      });
    }

    console.log('✅ Kullanıcı başarıyla eklendi:', data);

    return res.status(200).json({ 
      success: true,
      user: data[0]
    });

  } catch (err) {
    console.error('❌ Add user error:', err);
    return res.status(500).json({ 
      error: 'Sunucu hatası' 
    });
  }
}
