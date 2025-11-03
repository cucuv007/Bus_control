// pages/api/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: Get Turkey time (UTC+3)
function getTurkeyTime() {
  const now = new Date();
  // Add 3 hours to UTC
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return turkeyTime;
}

// Helper: Format time as HH:MM:SS
function formatTime(date) {
  return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}:00`;
}

// Helper: Convert HH:MM:SS to minutes
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default async function handler(req, res) {
  // GET: Fetch all records
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from(tableName)  // ← Parametreden geliyor
      .select('*')
      .order('Tarife_Saati', { ascending: true });
    
    if (error) {
      console.error('GET Error:', error);
      return res.status(500).json({ error: 'Veri alınamadı' });
    }
    return res.status(200).json(data);
  }

  // POST: Approve a departure
  if (req.method === 'POST') {
    try {
      // Get current Turkey time
      const turkeyTime = getTurkeyTime();
      const currentTimeStr = formatTime(turkeyTime);
      const currentMinutes = timeToMinutes(currentTimeStr);

      console.log('[APPROVAL] Current Turkey time:', currentTimeStr);

      // Fetch all records
      const { data: allRows, error: fetchError } = await supabase
        .from('VL13')
        .select('*')
        .order('Tarife_Saati', { ascending: true });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        return res.status(500).json({ error: 'Veri alınamadı' });
      }

      if (!allRows || allRows.length === 0) {
        return res.status(400).json({ error: 'Tablo boş' });
      }

      // Find the closest Tarife_Saati within ±10 minutes
      let closestRow = null;
      let closestDiff = Infinity;

      for (const row of allRows) {
        const rowMinutes = timeToMinutes(row.Tarife_Saati);
        const diff = Math.abs(rowMinutes - currentMinutes);

        if (diff <= 10 && diff < closestDiff) {
          closestRow = row;
          closestDiff = diff;
        }
      }

      // No match found
      if (!closestRow) {
        console.log('[APPROVAL] No record within ±10 minutes');
        return res.status(400).json({ 
          error: '±10 dakika içinde sefer bulunamadı',
          current_time: currentTimeStr
        });
      }

      // Calculate status (durum)
      const scheduleMinutes = timeToMinutes(closestRow.Tarife_Saati);
      const diffMinutes = currentMinutes - scheduleMinutes;

      let durum = 'Zamanında';
      if (diffMinutes < 0) {
        durum = 'Erken Çıkış';
      } else if (diffMinutes > 0) {
        durum = 'Geç Çıkış';
      }

      console.log('[APPROVAL] Match found:', {
        tarife: closestRow.Tarife,
        scheduled: closestRow.Tarife_Saati,
        actual: currentTimeStr,
        diff_minutes: diffMinutes,
        durum
      });

      // Update the record
      const { error: updateError } = await supabase
        .from('VL13')
        .update({ 
          Onaylanan: currentTimeStr,
          Durum: durum 
        })
        .eq('Tarife', closestRow.Tarife)
        .eq('Tarife_Saati', closestRow.Tarife_Saati);

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Güncelleme başarısız' });
      }

      return res.status(200).json({ 
        success: true,
        tarife: closestRow.Tarife,
        scheduled_time: closestRow.Tarife_Saati,
        actual_time: currentTimeStr,
        durum: durum,
        message: `${closestRow.Tarife} seferi onaylandı: ${currentTimeStr} (${durum})`
      });

    } catch (err) {
      console.error('[APPROVAL] Error:', err);
      return res.status(500).json({ error: 'Sistem hatası' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
