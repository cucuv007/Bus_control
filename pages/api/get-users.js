// pages/api/get-users.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📧 Kullanıcı mail adresleri getiriliyor...');

    const { data, error } = await supabase
      .from('Kullanıcılar')
      .select('Kullanıcı, mail');

    if (error) {
      console.error('Kullanıcılar getirme hatası:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Kullanıcılar alınamadı: ' + error.message 
      });
    }

    console.log(`✅ ${data.length} kullanıcı bulundu`);

    return res.status(200).json({
      success: true,
      users: data
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ 
      success: false,
      error: 'Hata: ' + err.message 
    });
  }
}
