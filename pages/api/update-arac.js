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

    // Bugünün gününü bul
    const bugun = new Date();
    const gunAdi = getGunFromDate(bugun);
    
    console.log(`📅 Bugünün günü: ${gunAdi}`);

    // Önce değiştirilecek satırı bul (Tarife_Saati'ni almak için)
    const { data: targetRow, error: selectError } = await supabase
      .from(gunAdi)
      .select('Tarife_Saati')
      .eq('Hat_Adi', Hat_Adi)
      .eq('Plaka', Plaka)
      .eq('Tarife', Tarife)
      .limit(1);

    if (selectError || !targetRow || targetRow.length === 0) {
      console.error('Hedef kayıt bulunamadı:', selectError);
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