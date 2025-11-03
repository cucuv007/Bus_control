
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Supabase'deki tüm tabloları listele
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.error('List tables error:', error);
      return res.status(500).json({ error: 'Tablolar alınamadı' });
    }

    // Sistem tablolarını filtrele
    const tables = data
      .map(t => t.table_name)
      .filter(name => !name.startsWith('pg_') && !name.startsWith('_') && name !== 'information_schema')
      .sort();

    return res.status(200).json({
      success: true,
      tables: tables
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
