import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('VL13').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { Tarife_Saati, Onaylanan, Durum } = req.body;
    const { data, error } = await supabase
      .from('VL13')
      .insert([{ Tarife_Saati, Onaylanan, Durum }]);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, data });
  }

  res.status(405).json({ error: 'Method not allowed' });
}

}
