// pages/api/get-next-bus.js
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
    const { tableName, currentTime, hareket } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: 'Table name gerekli' });
    }

    if (!currentTime) {
      return res.status(400).json({ error: 'currentTime gerekli' });
    }

    // Bugüne uygun çalışma zamanlarını al
    const allowedCalismaZamanlari = getAllowedCalismaZamanlari();

    // Tablodan tüm verileri al (Hareket filtresine göre)
    let query = supabase
      .from(tableName)
      .select('*')
      .order('Tarife_Saati', { ascending: true });

    // Hareket filtresi varsa uygula
    if (hareket) {
      query = query.eq('Hareket', hareket);
    }

    // Çalışma_Zamanı filtresi - bugüne uygun olanlar veya null olanlar
    query = query.or(
      allowedCalismaZamanlari.map(code => `Çalışma_Zamanı.eq.${code}`).join(',') + 
      ',Çalışma_Zamanı.is.null'
    );

    const { data, error } = await query;

    if (error) {
      console.error('Get table data error:', error);
      return res.status(500).json({ error: 'Veri alınamadı: ' + error.message });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'Veri bulunamadı'
      });
    }

    // Client'tan gelen zamanı parse et (format: "HH:MM:SS")
    const [hours, minutes, seconds] = currentTime.split(':').map(Number);
    const currentTimeInSeconds = hours * 3600 + minutes * 60 + seconds;

    let nextBus = null;
    let minDifference = Infinity;

    // Tüm satırları kontrol et ve en yakın saati bul
    const todayTable = getTodayTableName();
    
    console.log('🔍 Searching next bus for:', {
      tableName,
      currentTime,
      currentTimeInSeconds,
      hareket: hareket || 'Tümü',
      totalRows: data.length
    });
    
    for (const row of data) {
      const tarifeSaati = row.Tarife_Saati; // Format: "HH:MM" veya "HH:MM:SS"

      if (!tarifeSaati) continue;

      const timeParts = tarifeSaati.split(':').map(Number);
      const tarHours = timeParts[0];
      const tarMinutes = timeParts[1];
      const tarifeSaatiInSeconds = tarHours * 3600 + tarMinutes * 60;

      // Kalan zamanı hesapla
      let remainingSeconds = tarifeSaatiInSeconds - currentTimeInSeconds;

      // Eğer negatifse (geçmiş saatse), yarın için hesapla
      if (remainingSeconds < 0) {
        remainingSeconds += 24 * 3600;
      }

      // En yakın gelecek saati bul (0'dan büyük olmalı)
      if (remainingSeconds > 0 && remainingSeconds < minDifference) {
        minDifference = remainingSeconds;
        
        console.log('🎯 New closest bus candidate:', {
          tarifeSaati,
          tarife: row.Tarife,
          hareket: row.Hareket,
          remainingSeconds,
          minDifference
        });
        
        // Plaka bilgisini bugünün gün tablosundan al
        let plaka = 'Belediye Aracı';
        if (row.Tarife) {
          const plakaFromToday = await getPlakaForTarife(tableName, row.Tarife, todayTable);
          if (plakaFromToday) {
            plaka = plakaFromToday;
          }
        }
        
        nextBus = {
          tableName: tableName, // Hangi tablodan geldiğini ekle
          hatAdi: row.Hat_Adi || '-',
          plaka: plaka,
          tarife: row.Tarife || '-',
          hareket: row.Hareket || '-',
          calismaZamani: row.Çalışma_Zamanı || null, // Çalışma zamanı bilgisi
          tarifeSaati: tarifeSaati,
          remainingSeconds: Math.max(0, remainingSeconds)
        };
        
        console.log('✅ Next bus found:', {
          tableName,
          tarifeSaati,
          tarife: row.Tarife,
          hareket: row.Hareket,
          remainingSeconds
        });
      }
    }

    return res.status(200).json({
      success: !!nextBus,
      nextBus: nextBus,
      receivedTime: currentTime,
      hareket: hareket || 'Tümü',
      message: nextBus ? 'Sonraki otobüs bulundu' : 'Otobüs bulunamadı'
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
