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

// Bugünün gün tablosundan plaka bilgisini al (Yeni_Plaka varsa onu, yoksa Plaka'yı)
async function getPlakaForTarife(hatAdi, tarife, todayTable) {
  try {
    // Tarife normalizasyonu - T2 → T02, T3 → T03 gibi
    const normalizedTarife = tarife.match(/^T\d$/) ? tarife.replace(/^T(\d)$/, 'T0$1') : tarife;
    
    // Önce normalize edilmiş tarife ile dene
    let { data, error } = await supabase
      .from(todayTable)
      .select('Plaka, Yeni_Plaka')
      .eq('Hat_Adi', hatAdi)
      .eq('Tarife', normalizedTarife)
      .single();
    
    // Bulunamazsa orijinal tarife ile dene
    if (error && tarife !== normalizedTarife) {
      const result = await supabase
        .from(todayTable)
        .select('Plaka, Yeni_Plaka')
        .eq('Hat_Adi', hatAdi)
        .eq('Tarife', tarife)
        .single();
      
      data = result.data;
      error = result.error;
    }
    
    if (error || !data) {
      return { plaka: null, isYeniPlaka: false };
    }
    
    // Yeni_Plaka varsa ve boş değilse onu döndür, yoksa Plaka'yı döndür
    const hasYeniPlaka = data.Yeni_Plaka && data.Yeni_Plaka.trim() !== '';
    return {
      plaka: hasYeniPlaka ? data.Yeni_Plaka : data.Plaka,
      isYeniPlaka: hasYeniPlaka
    };
  } catch (err) {
    console.error(`Plaka bulunamadı (${todayTable}, ${hatAdi}, ${tarife}):`, err);
    return { plaka: null, isYeniPlaka: false };
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

    // Tablo adını temizle (başındaki ve sonundaki boşlukları kaldır)
    const cleanTableName = tableName.trim();
    console.log(`📋 Tablo adı: "${tableName}" → Temizlenmiş: "${cleanTableName}"`);

    // Bugüne uygun çalışma zamanlarını al
    const allowedCalismaZamanlari = getAllowedCalismaZamanlari();
    console.log(`📅 Bugün için uygun Çalışma_Zamanı kodları: ${allowedCalismaZamanlari.join(', ')}`);

    let query = supabase
      .from(cleanTableName)
      .select('*')
      .order('Tarife_Saati', { ascending: true });

    // Hareket filtresi varsa uygula
    if (hareket) {
      query = query.eq('Hareket', hareket);
    }

    // Çalışma_Zamanı filtresi - bugüne uygun olanlar veya null olanlar
    // Hem boşluklu ("HI - HS", "HI ") hem boşluksuz ("HI-HS", "HI") formatı destekle
    const calismaZamaniConditions = [];
    
    allowedCalismaZamanlari.forEach(code => {
      // Boşluksuz format: HI, HI-HS
      calismaZamaniConditions.push(`Çalışma_Zamanı.eq.${code}`);
      
      // Tire ile boşluklu format: HI - HS
      if (code.includes('-')) {
        calismaZamaniConditions.push(`Çalışma_Zamanı.eq.${code.replace('-', ' - ')}`);
      }
      
      // Sonunda boşluk olan format: "HI ", "HS ", "HC "
      calismaZamaniConditions.push(`Çalışma_Zamanı.eq.${code} `);
      
      // Başında boşluk olan format: " HI", " HS"
      calismaZamaniConditions.push(`Çalışma_Zamanı.eq. ${code}`);
    });
    
    calismaZamaniConditions.push('Çalışma_Zamanı.is.null');
    
    query = query.or(calismaZamaniConditions.join(','));
    
    console.log(`🔍 Çalışma_Zamanı filtreleri:`, allowedCalismaZamanlari);
    console.log(`🔍 Toplam ${calismaZamaniConditions.length} koşul oluşturuldu (boşluk varyasyonları dahil)`);

    const { data, error } = await query;

    if (error) {
      console.error('Get table data error:', error);
      console.log('📋 Hata detayı:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Veri alınamadı: ' + error.message });
    }

    console.log(`✅ ${data.length} kayıt döndürüldü (Çalışma_Zamanı filtresi uygulandı)`);
    
    // Debug: İlk birkaç kaydın Çalışma_Zamanı değerlerini göster
    if (data.length > 0) {
      const calismaZamaniValues = [...new Set(data.map(r => r['Çalışma_Zamanı']).filter(Boolean))];
      console.log(`📊 Döndürülen verideki Çalışma_Zamanı değerleri:`, calismaZamaniValues);
    };
    // Bugünün gün tablosundan plaka bilgilerini al
    const todayTable = getTodayTableName();
    console.log(`📅 Bugünün gün tablosu: ${todayTable}`);
    
    // Her kayıt için plaka bilgisini ekle
    const dataWithPlaka = await Promise.all(data.map(async (row) => {
      if (row.Tarife && row.Hat_Adi) {
        const plakaData = await getPlakaForTarife(row.Hat_Adi, row.Tarife, todayTable);
        return {
          ...row,
          Plaka: plakaData.plaka || 'Belediye Aracı',
          _IsYeniPlaka: plakaData.isYeniPlaka // Yeni plaka mı kontrol flag'i
        };
      }
      return {
        ...row,
        Plaka: row.Plaka || 'Belediye Aracı',
        _IsYeniPlaka: false
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
