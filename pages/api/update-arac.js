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

// Türkiye saatine göre gün adı (UTC day değil, lokal day)
function getTurkeyGun() {
  const gunler = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
  const now = new Date();
  // UTC+3 için 3 saat ekle
  const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
  // UTC günü al (çünkü turkeyTime UTC bazlı bir Date objesi)
  const dayIndex = turkeyTime.getUTCDay();
  return gunler[dayIndex];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Hat_Adi, Plaka, Tarife, Calisma_Zamani, Tarife_Saati, Yeni_Plaka, Aciklama } = req.body;

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

    // Önce değiştirilecek satırı bul (Tarife_Saati'ni almak için)
    let query = supabase
      .from(gunAdi)
      .select('Tarife_Saati, Plaka')
      .eq('Hat_Adi', Hat_Adi)
      .eq('Tarife', Tarife);
    
    // Eğer Tarife_Saati verilmişse onu da kullan (daha spesifik arama)
    if (Tarife_Saati) {
      query = query.eq('Tarife_Saati', Tarife_Saati);
    }
    
    // Eğer Plaka verilmişse onu da kullan
    if (Plaka) {
      query = query.eq('Plaka', Plaka);
    }
    
    const { data: targetRow, error: selectError } = await query.limit(1);

    console.log('🔍 Bulunan kayıt:', targetRow);

    if (selectError || !targetRow || targetRow.length === 0) {
      console.error('Hedef kayıt bulunamadı:', selectError);
      
      // Debug: Tabloda ne var görelim
      const { data: allRows } = await supabase
        .from(gunAdi)
        .select('Hat_Adi, Tarife, Tarife_Saati, Plaka')
        .eq('Hat_Adi', Hat_Adi)
        .limit(5);
      
      console.log('📋 Tablodaki ilk 5 kayıt (Hat_Adi eşleşen):', allRows);
      
      throw new Error('Güncellenecek kayıt bulunamadı. Hat, Plaka ve Tarife bilgilerini kontrol edin.');
    }

    const degisiklikSaati = targetRow[0].Tarife_Saati;
    console.log(`⏰ Değişiklik saati: ${degisiklikSaati} - Bu saatten sonraki tüm kayıtlar güncellenecek`);

    // İlgili gün tablosunda aynı Hat_Adi + Tarife olan VE Tarife_Saati >= değişiklik saati olan kayıtları güncelle
    const { data: updateData, error: updateError } = await supabase
      .from(gunAdi)
      .update({ Yeni_Plaka })
      .eq('Hat_Adi', Hat_Adi)
      .eq('Tarife', Tarife)
      .gte('Tarife_Saati', degisiklikSaati) // Sadece bu saatten sonraki kayıtlar
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
    console.error('Update arac error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}