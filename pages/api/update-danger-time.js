import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hatNames, uyariTime } = req.body;

    if (!hatNames || !Array.isArray(hatNames) || hatNames.length === 0) {
      return res.status(400).json({ error: 'Hat names array is required' });
    }

    if (!uyariTime || !/^\d{2}:\d{2}$/.test(uyariTime)) {
      return res.status(400).json({ error: 'Valid time in HH:MM format is required' });
    }

    // Convert HH:MM to HH:MM:00 for time type
    const timeValue = `${uyariTime}:00`;

    // Update Uyarı column for all selected hat names
    const { data, error } = await supabase
      .from('Danger')
      .update({ Uyarı: timeValue })
      .in('Name', hatNames);

    if (error) {
      console.error('Danger update error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      message: `${hatNames.length} hat(lar) için uyarı zamanı güncellendi`,
      updatedHats: hatNames
    });

  } catch (error) {
    console.error('Update danger time error:', error);
    return res.status(500).json({ error: error.message });
  }
}
