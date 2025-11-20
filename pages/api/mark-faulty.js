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
    const { tableName, hatAdi, calismaZamani, tarife, tarifeSaati, hareket } = req.body;

    if (!tableName || !hatAdi || !tarife || !tarifeSaati) {
      return res.status(400).json({ 
        error: 'tableName, hatAdi, tarife, tarifeSaati gerekli' 
      });
    }

    // Durum sütununa "Arızalı" yazılacak
    const faultyStatus = 'Arızalı';

    console.log('🔍 Arızalı işaretleme parametreleri:', {
      tableName,
      hatAdi,
      calismaZamani,
      tarife,
      tarifeSaati,
      hareket,
      faultyStatus
    });

    // Query oluştur
    let query = supabase
      .from(tableName)
      .update({ Durum: faultyStatus })
      .eq('Hat_Adi', hatAdi)
      .eq('Tarife', tarife)
      .eq('Tarife_Saati', tarifeSaati);

    // Opsiyonel kriterler
    if (calismaZamani) {
      query = query.eq('Çalışma_Zamanı', calismaZamani);
    }
    if (hareket) {
      query = query.eq('Hareket', hareket);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ Supabase update hatası:', error);
      return res.status(500).json({ 
        error: 'Arızalı işaretleme hatası', 
        details: error.message 
      });
    }

    if (!data || data.length === 0) {
      console.error('❌ Eşleşen satır bulunamadı');
      console.error('Aranan kriterler:', {
        tableName,
        Hat_Adi: hatAdi,
        Tarife: tarife,
        Tarife_Saati: tarifeSaati,
        Çalışma_Zamanı: calismaZamani || 'yok',
        Hareket: hareket || 'yok'
      });
      
      return res.status(404).json({ 
        error: 'Eşleşen satır bulunamadı',
        hint: 'Tablodaki sütun isimlerinin tam olarak eşleştiğinden emin olun',
        criteria: { tableName, hatAdi, tarife, tarifeSaati, calismaZamani, hareket }
      });
    }

    console.log('✅ Arızalı olarak işaretlendi:', data);

    return res.status(200).json({ 
      success: true, 
      status: faultyStatus,
      updatedRows: data.length
    });

  } catch (err) {
    console.error('❌ Mark faulty error:', err);
    return res.status(500).json({ 
      error: 'Sunucu hatası', 
      details: err.message 
    });
  }
}
