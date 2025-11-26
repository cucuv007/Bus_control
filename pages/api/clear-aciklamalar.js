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
    console.log('🧹 Açıklama tabloları temizleniyor...');

    // 1. Operasyon_Açıklama tablosunu temizle - tüm satırları sil
    const { error: opError } = await supabase
      .from('Operasyon_Açıklama')
      .delete()
      .gte('id', 0); // id >= 0 olan tüm satırlar (yani hepsi)

    if (opError) {
      console.error('Operasyon_Açıklama temizleme hatası:', opError);
      return res.status(500).json({
        success: false,
        error: 'Operasyon_Açıklama temizlenemedi: ' + opError.message
      });
    }

    console.log('✅ Operasyon_Açıklama temizlendi');

    // 2. Depolama_Açıklama tablosunu temizle - tüm satırları sil
    const { error: depError } = await supabase
      .from('Depolama_Açıklama')
      .delete()
      .gte('id', 0); // id >= 0 olan tüm satırlar (yani hepsi)

    if (depError) {
      console.error('Depolama_Açıklama temizleme hatası:', depError);
      return res.status(500).json({
        success: false,
        error: 'Depolama_Açıklama temizlenemedi: ' + depError.message
      });
    }

    console.log('✅ Depolama_Açıklama temizlendi');

    return res.status(200).json({
      success: true,
      message: 'Tablolar başarıyla temizlendi',
      operasyon: 'Temizlendi',
      depolama: 'Temizlendi'
    });

  } catch (err) {
    console.error('Clear aciklamalar hatası:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Tablolar temizlenemedi'
    });
  }
}
