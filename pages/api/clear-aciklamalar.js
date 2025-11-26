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

    // 3. Sequence'leri sıfırla (SQL kullanarak)
    const { error: seqOpError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER SEQUENCE "Operasyon_Açıklama_id_seq" RESTART WITH 1;'
    });

    if (seqOpError) {
      console.warn('⚠️ Operasyon_Açıklama sequence sıfırlanamadı:', seqOpError.message);
      // Hata olsa bile devam et, kritik değil
    } else {
      console.log('✅ Operasyon_Açıklama sequence sıfırlandı');
    }

    const { error: seqDepError } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER SEQUENCE "Depolama_Açıklama_id_seq" RESTART WITH 1;'
    });

    if (seqDepError) {
      console.warn('⚠️ Depolama_Açıklama sequence sıfırlanamadı:', seqDepError.message);
      // Hata olsa bile devam et, kritik değil
    } else {
      console.log('✅ Depolama_Açıklama sequence sıfırlandı');
    }

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
