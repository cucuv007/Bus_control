import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('Danger')
      .select('Name, Uyarı');

    if (error) {
      console.error('Get danger times error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Convert to a map for easy lookup
    const dangerMap = {};
    if (data) {
      data.forEach(row => {
        dangerMap[row.Name] = row.Uyarı;
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: dangerMap
    });

  } catch (error) {
    console.error('Get danger times error:', error);
    return res.status(500).json({ error: error.message });
  }
}
