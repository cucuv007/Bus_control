// pages/api/get-depolama-hats.js
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
    const { depolamaTables } = req.body;

    if (!depolamaTables || !Array.isArray(depolamaTables) || depolamaTables.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'depolamaTables array gerekli'
      });
    }

    console.log(`📦 Depolama tabloları: ${depolamaTables.join(', ')}`);

    const allHats = new Set(); // Tekrar eden hatları önlemek için Set kullan

    // Her depolama tablosundan Hat_Adi'leri çek
    for (const tableName of depolamaTables) {
      console.log(`🔍 "${tableName}" tablosundan Hat_Adi'ler çekiliyor...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('Hat_Adi');

      if (error) {
        console.error(`❌ "${tableName}" hata:`, error.message);
        continue; // Hata olsa bile diğer tablolara devam et
      }

      if (data && data.length > 0) {
        data.forEach(row => {
          if (row.Hat_Adi) {
            allHats.add(row.Hat_Adi.trim());
          }
        });
        console.log(`✅ "${tableName}": ${data.length} hat bulundu`);
      } else {
        console.log(`⚠️ "${tableName}": Veri yok`);
      }
    }

    const hatList = Array.from(allHats).sort();
    
    console.log(`✅ Toplam ${hatList.length} unique hat: ${hatList.join(', ')}`);

    return res.status(200).json({
      success: true,
      hats: hatList,
      count: hatList.length
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}
