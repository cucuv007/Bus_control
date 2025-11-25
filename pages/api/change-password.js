import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { username, newPassword } = req.body;

    // Validation
    if (!username || !newPassword) {
      console.log('❌ Eksik alanlar:', { username: !!username, newPassword: !!newPassword });
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı ve yeni şifre gereklidir' 
      });
    }

    console.log('🔄 Şifre güncelleniyor:', username);

    // Check if user exists
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

    // Update password
    const { data, error } = await supabase
      .from('Kullanıcı_Verileri')
      .update({ Şifre: newPassword })
      .eq('Kullanıcı', username)
      .select();

    if (error) {
      console.error('❌ Şifre güncelleme hatası:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Şifre güncellenirken hata oluştu: ' + error.message 
      });
    }

    console.log('✅ Şifre başarıyla güncellendi:', username);
    return res.status(200).json({ 
      success: true, 
      message: 'Şifre başarıyla güncellendi',
      user: data[0]
    });

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + err.message 
    });
  }
}
