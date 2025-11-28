// pages/api/get-row-aciklamalar.js
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
    const { Hat_Adi, Tarife, Tarife_Saati } = req.body;

    if (!Hat_Adi || !Tarife || !Tarife_Saati) {
      return res.status(400).json({ 
        error: 'Hat_Adi, Tarife ve Tarife_Saati gerekli' 
      });
    }

    console.log('🔍 Açıklama aranıyor:', { Hat_Adi, Tarife, Tarife_Saati });

    const allAciklamalar = [];

    // Operasyon_Açıklama tablosundan eşleşen kayıtları al
    const { data: operasyonData, error: operasyonError } = await supabase
      .from('Operasyon_Açıklama')
      .select('*')
      .eq('Hat_Adi', Hat_Adi)
      .eq('Tarife', Tarife)
      .eq('Tarife_Saati', Tarife_Saati)
      .order('Tarih', { ascending: false });

    if (operasyonError) {
      console.error('Operasyon açıklama hatası:', operasyonError);
    } else if (operasyonData && operasyonData.length > 0) {
      operasyonData.forEach(row => {
        allAciklamalar.push({
          ...row,
          _Kaynak: 'Operasyon'
        });
      });
      console.log(`✅ Operasyon: ${operasyonData.length} açıklama bulundu`);
    }

    // Depolama_Açıklama tablosundan eşleşen kayıtları al
    const { data: depolamaData, error: depolamaError } = await supabase
      .from('Depolama_Açıklama')
      .select('*')
      .eq('Hat_Adi', Hat_Adi)
      .eq('Tarife', Tarife)
      .eq('Tarife_Saati', Tarife_Saati)
      .order('Tarih', { ascending: false });

    if (depolamaError) {
      console.error('Depolama açıklama hatası:', depolamaError);
    } else if (depolamaData && depolamaData.length > 0) {
      depolamaData.forEach(row => {
        allAciklamalar.push({
          ...row,
          _Kaynak: 'Depolama'
        });
      });
      console.log(`✅ Depolama: ${depolamaData.length} açıklama bulundu`);
    }

    // Tarihe göre sırala (yeniden eskiye)
    allAciklamalar.sort((a, b) => {
      const dateA = new Date(a.Tarih);
      const dateB = new Date(b.Tarih);
      return dateB - dateA;
    });

    console.log(`📊 Toplam ${allAciklamalar.length} açıklama bulundu`);

    return res.status(200).json({
      success: true,
      data: allAciklamalar,
      count: allAciklamalar.length
    });

  } catch (err) {
    console.error('Get row aciklamalar error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}
