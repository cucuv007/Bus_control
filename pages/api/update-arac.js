// pages/api/update-arac.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tarihten gün ismini bul (Türkçe)
function getGunFromDate(date) {
  const gunler = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
  return gunler[date.getDay()];
}

// Türkiye saati ile günü al (UTC+3)
function getTurkeyDate() {
  const now = new Date();
  // UTC+3 için 3 saat ekle
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  return turkeyTime;
}

// Türkiye saatine göre gün adı (UTC+3)
function getTurkeyGun() {
  const gunler = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
  
  // Türkiye saat dilimi ile tarih al
  const now = new Date();
  const options = { timeZone: 'Europe/Istanbul', weekday: 'long' };
  const formatter = new Intl.DateTimeFormat('tr-TR', options);
  const gunTR = formatter.format(now).toUpperCase();
  
  // Eğer direkt Türkçe gün adı eşleşiyorsa kullan
  if (gunler.includes(gunTR)) {
    return gunTR;
  }
  
  // Fallback: Manuel hesaplama
  const turkeyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
  const dayIndex = turkeyTime.getDay();
  return gunler[dayIndex];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Hat_Adi, Plaka, Tarife, Calisma_Zamani, Tarife_Saati, Yeni_Plaka, Aciklama } = req.body;

    console.log('📥 İstek alındı:', { Hat_Adi, Plaka, Tarife, Calisma_Zamani, Tarife_Saati, Yeni_Plaka });

    if (!Hat_Adi || !Plaka || !Tarife || !Yeni_Plaka || !Aciklama) {
      return res.status(400).json({ 
        error: 'Hat_Adi, Plaka, Tarife, Yeni_Plaka ve Aciklama gerekli' 
      });
    }

    console.log('🚗 Araç değiştirme isteği:', {
      Hat_Adi,
      Plaka,
      Tarife,
      Yeni_Plaka: Yeni_Plaka.substring(0, 20) + '...' // Güvenlik için kısalt
    });

    // Bugünün gününü bul (Türkiye saati ile)
    const gunAdi = getTurkeyGun();
    const bugun = getTurkeyDate();
    
    console.log(`📅 Bugünün tarihi (Türkiye): ${bugun.toISOString()}`);
    console.log(`📅 Bugünün günü: ${gunAdi}`);
    console.log(`📅 Bakılacak tablo: ${gunAdi}`);

    console.log('🔍 Arama parametreleri:', {
      Hat_Adi,
      Plaka,
      Tarife,
      Calisma_Zamani,
      Tarife_Saati
    });

    // Gün tablolarında sadece Hat_Adi, Tarife, Plaka sütunları var
    // Tarife_Saati sütunu YOK! Sadece Hat_Adi + Tarife ile ara
    const { data: targetRow, error: selectError } = await supabase
      .from(gunAdi)
      .select('Plaka, Yeni_Plaka')
      .eq('Hat_Adi', Hat_Adi)
      .eq('Tarife', Tarife)
      .limit(1);

    console.log('🔍 Bulunan kayıt:', targetRow);

    if (selectError || !targetRow || targetRow.length === 0) {
      console.error('Hedef kayıt bulunamadı:', selectError);
      
      // Debug: Tabloda ne var görelim
      const { data: allRows, error: debugError } = await supabase
        .from(gunAdi)
        .select('Hat_Adi, Tarife, Plaka, Yeni_Plaka')
        .eq('Hat_Adi', Hat_Adi)
        .limit(5);
      
      console.log('📋 Tablodaki ilk 5 kayıt (Hat_Adi eşleşen):', allRows);
      console.log('📋 Debug hatası:', debugError);
      
      // Frontend'e debug bilgisi gönder
      return res.status(404).json({
        success: false,
        error: 'Güncellenecek kayıt bulunamadı. Hat ve Tarife bilgilerini kontrol edin.',
        debugInfo: {
          gunAdi,
          aramaParametreleri: { Hat_Adi, Tarife },
          bulunanKayitlar: allRows || [],
          selectError: selectError?.message
        }
      });
    }

    console.log(`✅ Kayıt bulundu - Güncelleme yapılacak`);

    // Aynı Hat_Adi + Tarife olan TÜM kayıtları güncelle
    // (Tarife_Saati sütunu olmadığı için saat bazlı filtreleme yapamıyoruz)
    const { data: updateData, error: updateError } = await supabase
      .from(gunAdi)
      .update({ Yeni_Plaka })
      .eq('Hat_Adi', Hat_Adi)
      .eq('Tarife', Tarife)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Araç güncellenemedi: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      console.error('Kayıt bulunamadı:', { Hat_Adi, Plaka, Tarife });
      throw new Error('Güncellenecek kayıt bulunamadı. Hat, Plaka ve Tarife bilgilerini kontrol edin.');
    }

    console.log(`✅ ${updateData.length} kayıt güncellendi`);

    // Session kontrolü - Operasyon mu Depolama mı?
    const userSession = req.headers['user-session'];
    if (!userSession) {
      throw new Error('Oturum bulunamadı');
    }

    const session = JSON.parse(userSession);
    const gorev = session.gorev;

    if (gorev !== 'Operasyon' && gorev !== 'Depolama') {
      throw new Error('Bu özellik sadece Operasyon ve Depolama kullanıcıları içindir');
    }

    // Açıklamayı ilgili tabloya ekle - Açıklama Ekle butonunun aynı mantığı
    const aciklamaEndpoint = gorev === 'Operasyon' 
      ? 'Operasyon_Açıklama' 
      : 'Depolama_Açıklama';

    const { data: aciklamaData, error: aciklamaError } = await supabase
      .from(aciklamaEndpoint)
      .insert({
        Hat_Adi,
        'Çalışma_Zamanı': Calisma_Zamani,
        Tarife,
        Tarife_Saati,
        Plaka,
        'Açıklama': `🚗 Araç değiştirildi: "${Plaka}" → "${Yeni_Plaka}". ${Aciklama}`,
        Tarih: new Date().toISOString()
      });

    if (aciklamaError) {
      console.error('Açıklama eklenemedi:', aciklamaError);
      // Açıklama hatası araç güncellemesini etkilemesin
      console.log('⚠️ Açıklama eklenemedi ama araç güncellendi');
    } else {
      console.log('✅ Açıklama eklendi');
    }

    return res.status(200).json({
      success: true,
      message: 'Araç başarıyla güncellendi',
      updatedRecords: updateData.length,
      tableName: gunAdi
    });

  } catch (err) {
    console.error('❌ Update arac error:', err);
    console.error('❌ Error stack:', err.stack);
    return res.status(500).json({ 
      success: false, 
      error: err.message,
      details: err.stack?.substring(0, 200) // İlk 200 karakter
    });
  }
}