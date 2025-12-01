import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Türkiye saat diliminde şu anki saati al
function getTurkeyTime() {
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  return formatter.format(new Date());
}

// Saat karşılaştırma (HH:MM:SS formatında)
function isTimeBetween(currentTime, startTime, finishTime) {
  const current = currentTime.split(':').map(Number);
  const start = startTime.split(':').map(Number);
  const finish = finishTime.split(':').map(Number);
  
  const currentSeconds = current[0] * 3600 + current[1] * 60 + current[2];
  const startSeconds = start[0] * 3600 + start[1] * 60 + start[2];
  const finishSeconds = finish[0] * 3600 + finish[1] * 60 + finish[2];
  
  return currentSeconds >= startSeconds && currentSeconds <= finishSeconds;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { action, gorev } = req.body; // action: "login" veya "hatlar-yenile"
    
    // Admin için her zaman izin ver
    if (gorev === 'Admin') {
      return res.status(200).json({ 
        success: true, 
        allowed: true,
        reason: 'Admin yetkisi - zaman kısıtlaması yok',
        isAdmin: true
      });
    }

    // Saat tablosundan "Hatları Yenile" kaydını getir
    const { data, error } = await supabase
      .from('Saat')
      .select('Name, Start, Finish')
      .eq('Name', 'Hatları Yenile')
      .single();

    if (error || !data) {
      console.error('❌ Saat tablosu hatası:', error);
      // Tablo yoksa veya kayıt yoksa izin ver
      return res.status(200).json({ 
        success: true, 
        allowed: true,
        reason: 'Saat kısıtlaması bulunamadı, işlem yapılabilir',
        noTimeRestriction: true
      });
    }

    const currentTime = getTurkeyTime();
    const startTime = data.Start;
    const finishTime = data.Finish;

    console.log('⏰ Zaman kontrolü:', {
      action,
      gorev,
      currentTime,
      startTime,
      finishTime
    });

    // Şu anki saat Start ve Finish arasında mı?
    const inRestrictedPeriod = isTimeBetween(currentTime, startTime, finishTime);

    if (inRestrictedPeriod) {
      // Yasak saatler içinde
      return res.status(200).json({ 
        success: true, 
        allowed: false,
        reason: `Bu işlem ${startTime} - ${finishTime} saatleri arasında yapılamaz`,
        currentTime,
        startTime,
        finishTime,
        inRestrictedPeriod: true
      });
    } else {
      // İzin verilen saat
      return res.status(200).json({ 
        success: true, 
        allowed: true,
        reason: 'İşlem yapılabilir',
        currentTime,
        startTime,
        finishTime,
        inRestrictedPeriod: false
      });
    }

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası: ' + err.message 
    });
  }
}
