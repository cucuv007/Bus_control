import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { hatNames, uyariTime } = req.body;

    if (!hatNames || !Array.isArray(hatNames) || hatNames.length === 0) {
      return res.status(400).json({ success: false, error: 'Hat names array is required' });
    }

    if (!uyariTime || !/^\d{2}:\d{2}$/.test(uyariTime)) {
      return res.status(400).json({ success: false, error: 'Valid time in HH:MM format is required' });
    }

    console.log(`📋 Takip tablosunda ${hatNames.length} hat güncelleniyor...`);

    // Convert HH:MM to HH:MM:00 for time type
    const timeValue = `${uyariTime}:00`;

    // Update Uyarı column for all selected hat names
    const { data, error } = await supabase
      .from('Takip')
      .update({ Uyarı: timeValue })
      .in('Name', hatNames);

    if (error) {
      console.error('❌ Takip update error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Güncelleme hatası: ' + error.message,
        details: error
      });
    }

    console.log(`✅ ${hatNames.length} hat başarıyla güncellendi`);

    return res.status(200).json({ 
      success: true, 
      message: `${hatNames.length} hat(lar) için uyarı zamanı güncellendi`,
      updatedHats: hatNames,
      count: hatNames.length
    });

  } catch (err) {
    console.error('❌ Sunucu hatası:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Sunucu hatası: ' + err.message 
    });
  }
}
