import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { table, hatAdi, calismaZamani, tarife, tarifeSaati, plaka, aciklamaPattern } = req.body;

  if (!table || !hatAdi || !tarife || !tarifeSaati || !aciklamaPattern) {
    return res.status(400).json({ error: 'Eksik parametreler' });
  }

  try {
    // Önce eşleşen kayıtları bul
    let query = supabase
      .from(table)
      .select('*')
      .eq('Hat_Adi', hatAdi)
      .eq('Tarife', tarife)
      .eq('Tarife_Saati', tarifeSaati)
      .ilike('Açıklama', `%${aciklamaPattern}%`); // (Arızalı) içeren açıklamaları bul

    // Çalışma zamanı varsa ekle
    if (calismaZamani) {
      query = query.eq('Çalışma_Zamanı', calismaZamani);
    }

    // Plaka varsa ekle
    if (plaka) {
      query = query.eq('Plaka', plaka);
    }

    const { data: matchedRows, error: selectError } = await query;

    if (selectError) {
      console.error('Arızalı açıklama arama hatası:', selectError);
      return res.status(500).json({ error: 'Açıklama arama hatası', details: selectError.message });
    }

    if (!matchedRows || matchedRows.length === 0) {
      console.log('Silinecek arızalı açıklama bulunamadı');
      return res.status(200).json({ success: true, message: 'Silinecek kayıt bulunamadı', deletedCount: 0 });
    }

    console.log(`${matchedRows.length} adet arızalı açıklama bulundu, siliniyor...`);

    // Bulunan kayıtları sil
    const deletePromises = matchedRows.map(row => 
      supabase
        .from(table)
        .delete()
        .eq('id', row.id)
    );

    const deleteResults = await Promise.all(deletePromises);

    // Hata kontrolü
    const errors = deleteResults.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Silme hatası:', errors);
      return res.status(500).json({ error: 'Bazı kayıtlar silinemedi', details: errors });
    }

    console.log(`✅ ${matchedRows.length} adet arızalı açıklama silindi`);

    return res.status(200).json({
      success: true,
      message: 'Arızalı açıklamalar silindi',
      deletedCount: matchedRows.length,
      deletedRows: matchedRows
    });

  } catch (err) {
    console.error('Arızalı açıklama silme hatası:', err);
    return res.status(500).json({ error: 'Sunucu hatası', details: err.message });
  }
}
