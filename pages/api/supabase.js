import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('VL13')
      .select('*')
      .order('Tarife_Saati', { ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    try {
      // Şu anki saati al (saat:dakika:00 formatında)
      const now = new Date();
      const onaylanan = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

      // Tüm kayıtları çek
      const { data: allRows, error: fetchError } = await supabase
        .from('VL13')
        .select('*')
        .order('Tarife_Saati', { ascending: true });

      if (fetchError) return res.status(500).json({ error: fetchError.message });
      if (!allRows || allRows.length === 0) {
        return res.status(400).json({ error: 'Tablo boş.' });
      }

      // Şu anki saate en yakın Tarife_Saati'ni bul (±10 dakika içinde)
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      let closestRow = null;
      let closestDiff = Infinity;

      for (const row of allRows) {
        const [h, m] = row.Tarife_Saati.split(':').map(Number);
        const rowMinutes = h * 60 + m;
        const diff = Math.abs(rowMinutes - nowMinutes);

        if (diff <= 10 && diff < closestDiff) {
          closestRow = row;
          closestDiff = diff;
        }
      }

      if (!closestRow) {
        return res.status(400).json({ 
          error: '±10 dakika içinde kayıt bulunamadı.',
          current_time: onaylanan
        });
      }

      // Durum belirle
      const [th, tm] = closestRow.Tarife_Saati.split(':').map(Number);
      const [oh, om] = onaylanan.split(':').map(Number);
      const tarifeMinutes = th * 60 + tm;
      const onayMinutes = oh * 60 + om;
      const diffMinutes = onayMinutes - tarifeMinutes;

      let durum = 'Zamanında';
      if (diffMinutes < 0) durum = 'Erken Çıkış';
      else if (diffMinutes > 0) durum = 'Geç Çıkış';

      // Tarife_Saati'ye göre güncelle (UNIQUE olduğu için sorun olmaz)
      const { data: updateData, error: updateError } = await supabase
        .from('VL13')
        .update({ 
          Onaylanan: onaylanan, 
          Durum: durum 
        })
        .eq('Tarife_Saati', closestRow.Tarife_Saati);

      if (updateError) return res.status(500).json({ error: updateError.message });

      return res.status(200).json({ 
        success: true, 
        message: `✅ Onaylandı: ${closestRow.Tarife_Adi} ${closestRow.Tarife_Saati} → ${onaylanan} (${durum})`,
        data: updateData
      });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
