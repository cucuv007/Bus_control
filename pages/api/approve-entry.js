// pages/api/approve-entry.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper: Get Turkey time (UTC+3)
function getTurkeyTime() {
  const now = new Date();
  const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  return turkeyTime;
}

// Helper: Format time as HH:MM:SS
function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;
}

// Helper: Convert HH:MM:SS to minutes
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
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

    // Get current Turkey time
    const turkeyTime = getTurkeyTime();
    const currentTimeStr = formatTime(turkeyTime);
    const currentMinutes = timeToMinutes(currentTimeStr);

    console.log('[APPROVAL] Current Turkey time:', currentTimeStr);
    console.log('[APPROVAL] Table:', tableName);
    console.log('[APPROVAL] Hareket filter:', hareket || 'Tümü');

    // Fetch all records from selected table (with Hareket filter if provided)
    let query = supabase
      .from(tableName)
      .select('*')
      .order('Tarife_Saati', { ascending: true });

    // Hareket filtresi varsa uygula
    if (hareket) {
      query = query.eq('Hareket', hareket);
    }

    const { data: allRows, error: fetchError } = await query;

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: 'Veri alınamadı' });
    }

    if (!allRows || allRows.length === 0) {
      return res.status(400).json({ error: 'Tablo boş veya filtre ile eşleşen kayıt yok' });
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
      hareket: closestRow.Hareket,
      scheduled: closestRow.Tarife_Saati,
      actual: currentTimeStr,
      diff_minutes: diffMinutes,
      durum
    });

    // Update the record
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        Onaylanan: currentTimeStr,
        Durum: durum
      })
      .eq('Tarife_Saati', closestRow.Tarife_Saati)
      .eq('Hareket', closestRow.Hareket);

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Güncelleme başarısız' });
    }

    return res.status(200).json({
      success: true,
      tableName: tableName,
      tarife: closestRow.Tarife,
      hareket: closestRow.Hareket,
      scheduled_time: closestRow.Tarife_Saati,
      actual_time: currentTimeStr,
      durum: durum,
      message: `${closestRow.Tarife} (${closestRow.Hareket}) seferi onaylandı: ${currentTimeStr} (${durum})`
    });

  } catch (err) {
    console.error('[APPROVAL] Error:', err);
    return res.status(500).json({ error: 'Sistem hatası: ' + err.message });
  }
}
