import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL veya Service Key eksik');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🧹 Açıklama tabloları temizleniyor...');

    // 1. Operasyon_Açıklama tablosunu temizle
    const { error: opError } = await supabase
      .from('Operasyon_Açıklama')
      .delete()
      .neq('id', 0); // Tüm satırları sil

    if (opError) {
      console.error('Operasyon_Açıklama temizleme hatası:', opError);
      throw new Error('Operasyon_Açıklama temizlenemedi: ' + opError.message);
    }

    console.log('✅ Operasyon_Açıklama temizlendi');

    // 2. Depolama_Açıklama tablosunu temizle
    const { error: depError } = await supabase
      .from('Depolama_Açıklama')
      .delete()
      .neq('id', 0); // Tüm satırları sil

    if (depError) {
      console.error('Depolama_Açıklama temizleme hatası:', depError);
      throw new Error('Depolama_Açıklama temizlenemedi: ' + depError.message);
    }

    console.log('✅ Depolama_Açıklama temizlendi');

    // Not: Sequence sıfırlama Supabase'de otomatik yapılır
    console.log('ℹ️ Sequenceler bir sonraki insert ile otomatik düzenlenecek');

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
