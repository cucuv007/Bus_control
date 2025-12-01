// pages/api/delete-aciklama-by-ids.js
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
    const { table, ids } = req.body;

    if (!table || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Tablo adı ve ID listesi gerekli' });
    }

    console.log(`🗑️ Silme isteği: ${table} tablosundan ${ids.length} kayıt`);

    // Her ID için silme işlemi
    const deletePromises = ids.map(id => 
      supabase
        .from(table)
        .delete()
        .eq('id', id)
    );

    const results = await Promise.all(deletePromises);

    // Hata kontrolü
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Silme hataları:', errors);
      return res.status(500).json({ 
        error: 'Bazı kayıtlar silinemedi', 
        details: errors 
      });
    }

    console.log(`✅ ${ids.length} kayıt başarıyla silindi`);

    return res.status(200).json({
      success: true,
      deletedCount: ids.length,
      deletedIds: ids
    });

  } catch (err) {
    console.error('Delete aciklama by IDs error:', err);
    return res.status(500).json({ 
      error: 'Sunucu hatası', 
      details: err.message 
    });
  }
}
