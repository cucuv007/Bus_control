
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
    const { tableName } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: 'Table name gerekli' });
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('Tarife_Saati', { ascending: true });

    if (error) {
      console.error('Get table data error:', error);
      return res.status(500).json({ error: 'Veri alınamadı: ' + error.message });
    }

    return res.status(200).json({
      success: true,
      tableName: tableName,
      data: data
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
