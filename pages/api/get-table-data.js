// pages/api/get-table-data.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bugünün gününe göre uygun Çalışma_Zamanı kodlarını döndür
function getAllowedCalismaZamanlari() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
  
  const allowedCodes = [];
  
  // Pazartesi-Cuma (1-5): Hafta içi
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    allowedCodes.push('HI', 'HI-HC', 'HI-HS');
  }
  
  // Cumartesi (6)
  if (dayOfWeek === 6) {
    allowedCodes.push('HI-HC', 'HI-HS', 'HS', 'HC');
  }
  
  // Pazar (0)
  if (dayOfWeek === 0) {
    allowedCodes.push('HI-HS', 'HS', 'HP');
  }
  
  return allowedCodes;
}

// Bugünün gün adını döndür (PAZARTESİ, SALI, ...)
function getTodayTableName() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  const gunler = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
  return gunler[dayOfWeek];
}

// Bugünün gün tablosundan plaka bilgisini al
async function getPlakaForTarife(hatAdi, tarife, todayTable) {
  try {
    const { data, error } = await supabase
      .from(todayTable)
      .select('Plaka')
      .eq('Hat_Adi', hatAdi)
      .eq('Tarife', tarife)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.Plaka;
  } catch (err) {
    console.error(`Plaka bulunamadı (${todayTable}, ${hatAdi}, ${tarife}):`, err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tableName, hareket } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: 'Table name gerekli' });
    }

    // Bugüne uygun çalışma zamanlarını al
    const allowedCalismaZamanlari = getAllowedCalismaZamanlari();
    console.log(`📅 Bugün için uygun Çalışma_Zamanı kodları: ${allowedCalismaZamanlari.join(', ')}`);

    let query = supabase
      .from(tableName)
      .select('*')
      .order('Tarife_Saati', { ascending: true });

    // Hareket filtresi varsa uygula
    if (hareket) {
      query = query.eq('Hareket', hareket);
    }

    // Çalışma_Zamanı filtresi - bugüne uygun olanlar veya null olanlar
    // Hem boşluklu ("HI - HS") hem boşluksuz ("HI-HS") formatı destekle
    const calismaZamaniConditions = [];
    
    allowedCalismaZamanlari.forEach(code => {
      calismaZamaniConditions.push(`Çalışma_Zamanı.eq.${code}`); // Boşluksuz: HI-HS
      calismaZamaniConditions.push(`Çalışma_Zamanı.eq.${code.replace('-', ' - ')}`); // Boşluklu: HI - HS
    });
    
    calismaZamaniConditions.push('Çalışma_Zamanı.is.null');
    
    query = query.or(calismaZamaniConditions.join(','));
    
    console.log(`🔍 Çalışma_Zamanı filtreleri:`, allowedCalismaZamanlari);

    const { data, error } = await query;

    if (error) {
      console.error('Get table data error:', error);
      console.log('📋 Hata detayı:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Veri alınamadı: ' + error.message });
    }

    console.log(`✅ ${data.length} kayıt döndürüldü (Çalışma_Zamanı filtresi uygulandı)`);
    // Bugünün gün tablosundan plaka bilgilerini al
    const todayTable = getTodayTableName();
    console.log(`📅 Bugünün gün tablosu: ${todayTable}`);
    
    // Her kayıt için plaka bilgisini ekle
    const dataWithPlaka = await Promise.all(data.map(async (row) => {
      if (row.Tarife) {
        const plaka = await getPlakaForTarife(tableName, row.Tarife, todayTable);
        return {
          ...row,
          Plaka: plaka || 'Belediye Aracı' // Bulunan plaka veya "Belediye Aracı"
        };
      }
      return {
        ...row,
        Plaka: row.Plaka || 'Belediye Aracı'
      };
    }));

    console.log(`🚗 Plaka bilgileri eklendi`);

    return res.status(200).json({
      success: true,
      tableName: tableName,
      hareket: hareket || 'Tümü',
      calismaZamanlari: allowedCalismaZamanlari,
      todayTable: todayTable,
      data: dataWithPlaka
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
