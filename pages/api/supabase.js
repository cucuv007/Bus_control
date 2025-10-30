import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('VL13').select('*');
      
      if (error) {
        console.error('Supabase GET error:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json(data || []);
    } 
    
    else if (req.method === 'POST') {
      const { Tarife, Tarife_Saati, Onaylanan, Durum } = req.body;

      if (!Tarife || !Tarife_Saati || !Onaylanan || !Durum) {
        return res.status(400).json({ error: 'Eksik alan: Tarife, Tarife_Saati, Onaylanan, Durum gerekli' });
      }

      const { data, error } = await supabase
        .from('VL13')
        .insert([{ Tarife, Tarife_Saati, Onaylanan, Durum }]);

      if (error) {
        console.error('Supabase POST error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    } 
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
