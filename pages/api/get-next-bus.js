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
    const { tableName } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: 'Table name gerekli' });
    }

    // Tablodan tüm verileri al
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('Tarife_Saati', { ascending: true });

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

    // Şu anki zamanı al
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentSeconds = now.getSeconds();
    const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + currentSeconds;

    // Sonraki otobüsü bul (10 dakika içinde)
    let nextBus = null;
    const tenMinutesInSeconds = 10 * 60;

    for (const row of data) {
      const tarifeSaati = row.Tarife_Saati; // Format: "HH:MM"
      
      if (!tarifeSaati) continue;

      const [hours, minutes] = tarifeSaati.split(':').map(Number);
      const tarifeSaatiInSeconds = hours * 3600 + minutes * 60;

      // Kalan zamanı hesapla
      let remainingSeconds = tarifeSaatiInSeconds - currentTimeInSeconds;

      // Eğer negatifse, yarın için hesapla
      if (remainingSeconds < 0) {
        remainingSeconds += 24 * 3600;
      }

      // 10 dakika içindeyse ve en yakın olanı seç
      if (remainingSeconds > 0 && remainingSeconds <= tenMinutesInSeconds) {
        if (!nextBus || remainingSeconds < nextBus.remainingSeconds) {
          nextBus = {
            plaka: row.Plaka || '-',
            tarife: row.Tarife || '-',
            tarifeSaati: tarifeSaati,
            remainingSeconds: Math.max(0, remainingSeconds)
          };
        }
      }
    }

    return res.status(200).json({
      success: !!nextBus,
      nextBus: nextBus,
      currentTime: `${currentHours}:${currentMinutes}`,
      message: nextBus ? 'Sonraki otobüs bulundu' : 'Sonraki 10 dakika içinde otobüs yok'
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
