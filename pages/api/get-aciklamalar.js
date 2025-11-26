import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { gorev } = req.body;

    // Validation
    if (!gorev || (gorev !== 'Operasyon' && gorev !== 'Depolama')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Geçersiz görev. Operasyon veya Depolama olmalı.' 
      });
    }

    const tableName = gorev === 'Operasyon' ? 'Operasyon_Açıklama' : 'Depolama_Açıklama';
    
    console.log(`📋 ${tableName} tablosundan veri çekiliyor...`);

    // Tüm açıklamaları çek, ID'ye göre sırala
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('id', { ascending: false }); // En yeni en üstte

    if (error) {
      console.error('❌ Supabase hatası:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Veri çekilemedi: ' + error.message,
        details: error
      });
    }

    console.log(`✅ ${data?.length || 0} kayıt bulundu`);

    return res.status(200).json({ 
      success: true, 
      data: data || [],
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
