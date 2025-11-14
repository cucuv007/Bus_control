// pages/api/get-next-bus.js
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
    const { tableName, currentTime, hareket } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: 'Table name gerekli' });
    }

    if (!currentTime) {
      return res.status(400).json({ error: 'currentTime gerekli' });
    }

    // Tablodan tüm verileri al (Hareket filtresine göre)
    let query = supabase
      .from(tableName)
      .select('*')
      .order('Tarife_Saati', { ascending: true });

    // Hareket filtresi varsa uygula
    if (hareket) {
      query = query.eq('Hareket', hareket);
    }

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
        nextBus = {
          hatAdi: row.Hat_Adi || '-',
          plaka: row.Plaka || '-',
          tarife: row.Tarife || '-',
          hareket: row.Hareket || '-',
          tarifeSaati: tarifeSaati,
          remainingSeconds: Math.max(0, remainingSeconds)
        };
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
