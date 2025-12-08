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
// Finish 00:00:00 ise bu 24:00:00 (gece yarısı) anlamına gelir
function isTimeBetween(currentTime, startTime, finishTime) {
  const current = currentTime.split(':').map(Number);
  const start = startTime.split(':').map(Number);
  const finish = finishTime.split(':').map(Number);
  
  const currentSeconds = current[0] * 3600 + current[1] * 60 + current[2];
  const startSeconds = start[0] * 3600 + start[1] * 60 + start[2];
  let finishSeconds = finish[0] * 3600 + finish[1] * 60 + finish[2];
  
  // Eğer finish 00:00:00 ise, bunu 24:00:00 (86400 saniye) olarak kabul et
  if (finishSeconds === 0) {
    finishSeconds = 86400; // 24 * 3600 = 86400 saniye
  }
  
  // Gece yarısını geçen durumları kontrol et
  if (finishSeconds < startSeconds) {
    // Örnek: Start 22:00, Finish 02:00 (ertesi gün)
    return currentSeconds >= startSeconds || currentSeconds <= finishSeconds;
  }
  
  return currentSeconds >= startSeconds && currentSeconds <= finishSeconds;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { action, gorev } = req.body; // action: "login", "hatlar-yenile", "yukleme", "auto-reset"
    
    // Admin için her zaman izin ver
    if (gorev === 'Admin') {
      return res.status(200).json({ 
        success: true, 
        allowed: true,
        reason: 'Admin yetkisi - zaman kısıtlaması yok',
        isAdmin: true
      });
    }

    // Action'a göre hangi Name değerini kullanacağımızı belirle
    let restrictionName = 'Hatları Yenile'; // default
    if (action === 'yukleme') {
      restrictionName = 'Yükleme';
    } else if (action === 'auto-reset') {
      restrictionName = 'AutoReset';
    }

    // Saat tablosundan ilgili kaydı getir
    const { data, error } = await supabase
      .from('Saat')
      .select('Name, Start, Finish')
      .eq('Name', restrictionName)
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
      restrictionName,
      gorev,
      currentTime,
      startTime,
      finishTime
    });

    // AutoReset için özel kontrol
    if (action === 'auto-reset') {
      // Start değeri 00:00:00 - 06:00:00 aralığında mı kontrol et
      const startParts = startTime.split(':').map(Number);
      const startHour = startParts[0];
      const startMinute = startParts[1];
      const startSecond = startParts[2];
      
      const isEarlyMorning = (startHour < 6) || (startHour === 6 && startMinute === 0 && startSecond === 0);
      
      console.log('🌅 Early morning check:', {
        startTime,
        startHour,
        isEarlyMorning
      });
      
      if (isEarlyMorning) {
        // Start 00:00:00 - 06:00:00 aralığında
        // Bu durumda YARIN için kontrol yapmalıyız
        // BUGÜN hiçbir zaman izin verme, YARIN Start-Finish dışında izin ver
        
        // Şimdi hangi gündeyiz kontrol et
        const now = new Date();
        const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
        const currentHour = turkeyTime.getHours();
        const currentDate = turkeyTime.getDate();
        
        console.log('📅 Gün ve saat kontrolü:', {
          currentDate,
          currentHour,
          currentTime
        });
        
        // YARININ tarihini hesapla
        const tomorrow = new Date(turkeyTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.getDate();
        
        console.log('📅 Yarın tarihi:', tomorrowDate);
        
        // Eğer şu an YARIN'ın tarihindeyse ve Start-Finish dışındaysa izin ver
        // Ama şu an BUGÜN'ün tarihindeyse izin verme
        
        // Basit kontrol: Bugün sabah 00:00-06:00 arasında mıyız?
        if (currentHour >= 0 && currentHour < 6) {
          // Sabahın erken saatleri - yasak saat aralığında mıyız?
          const inRestrictedPeriod = isTimeBetween(currentTime, startTime, finishTime);
          if (inRestrictedPeriod) {
            console.log('🚫 Yarının yasak saatlerindeyiz - işlem yapılamaz');
            return res.status(200).json({ 
              success: true, 
              allowed: false,
              reason: `Otomatik temizleme ${startTime} - ${finishTime} saatleri arasında yapılamaz`,
              currentTime,
              startTime,
              finishTime,
              inRestrictedPeriod: true,
              tomorrowRestricted: true
            });
          } else {
            console.log('✅ Yarının izin verilen saatlerindeyiz - işlem yapılabilir');
            return res.status(200).json({ 
              success: true, 
              allowed: true,
              reason: 'Otomatik temizleme yapılabilir (yarının izin verilen saatleri)',
              currentTime,
              startTime,
              finishTime,
              inRestrictedPeriod: false,
              tomorrowAllowed: true
            });
          }
        } else {
          // Bugün gündüz - yarın için işlem yapılacak, bugün izin verme
          console.log('🚫 Bugün gündüz - otomatik temizleme yarın yapılacak');
          return res.status(200).json({ 
            success: true, 
            allowed: false,
            reason: `Start değeri ${startTime} erken sabah aralığında (00:00:00-06:00:00). Otomatik temizleme yarın ${finishTime} sonrasında yapılacak.`,
            currentTime,
            startTime,
            finishTime,
            isEarlyMorning: true,
            nextDayProcessing: true
          });
        }
      } else {
        // Start 06:00:01 ve sonrası
        // Bugün işlem yapabilir ama Start-Finish aralığında YAPAMAZ
        const inRestrictedPeriod = isTimeBetween(currentTime, startTime, finishTime);
        
        if (inRestrictedPeriod) {
          // Yasak saatler içinde - izin verme
          console.log('🚫 Şu an yasak saatler içinde - otomatik temizleme yapılamaz');
          return res.status(200).json({ 
            success: true, 
            allowed: false,
            reason: `Otomatik temizleme ${startTime} - ${finishTime} saatleri arasında yapılamaz`,
            currentTime,
            startTime,
            finishTime,
            inRestrictedPeriod: true
          });
        } else {
          // İzin verilen saat - otomatik temizleme yapılabilir
          console.log('✅ İzin verilen saat - otomatik temizleme yapılabilir');
          return res.status(200).json({ 
            success: true, 
            allowed: true,
            reason: 'Otomatik temizleme yapılabilir',
            currentTime,
            startTime,
            finishTime,
            inRestrictedPeriod: false
          });
        }
      }
    }

    // Şu anki saat Start ve Finish arasında mı?
    const inRestrictedPeriod = isTimeBetween(currentTime, startTime, finishTime);

    if (inRestrictedPeriod) {
      // Yasak saatler içinde
      const finishDisplay = finishTime === '00:00:00' ? '24:00:00 (Gece Yarısı)' : finishTime;
      return res.status(200).json({ 
        success: true, 
        allowed: false,
        reason: `Bu işlem ${startTime} - ${finishDisplay} saatleri arasında yapılamaz`,
        currentTime,
        startTime,
        finishTime,
        finishDisplay,
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
