import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    if(req.method === 'GET'){
      const { data, error } = await supabase.from('VL13').select('*').limit(100);
      if(error) throw error;
      res.status(200).json(data);
    }
    else if(req.method === 'POST'){
      const { Tarife_Saati, Onaylanan, Durum } = req.body;
      const { error } = await supabase
        .from('VL13')
        .update({ Onaylanan, Durum })
        .eq('Tarife_Saati', Tarife_Saati);
      if(error) throw error;
      res.status(200).json({ success:true });
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
