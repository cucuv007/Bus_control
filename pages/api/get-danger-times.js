import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('📋 Takip tablosundan danger times çekiliyor...');
    
    const { data, error } = await supabase
      .from('Takip')
      .select('Name, Uyarı')
      .order('Name', { ascending: true });

    if (error) {
      console.error('❌ Supabase hatası:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Veri çekilemedi: ' + error.message,
        details: error
      });
    }

    console.log(`✅ ${data?.length || 0} kayıt bulundu`);

    // Convert to a map for easy lookup
    const dangerMap = {};
    if (data) {
      data.forEach(row => {
        dangerMap[row.Name] = row.Uyarı;
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: dangerMap,
      count: data?.length || 0
    });

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Sunucu hatası: ' + err.message 
    });
  }
}
