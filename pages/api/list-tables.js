// pages/api/list-tables.js
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
    console.log('📋 Fetching table names...');

    // Supabase'deki get_table_names() fonksiyonunu çağır
    const { data, error } = await supabase
      .rpc('get_table_names');

    if (error) {
      console.error('RPC error:', error);
      return res.status(500).json({ 
        error: 'Tablolar alınamadı: ' + error.message 
      });
    }

    // Gün tablolarını ve depolama tablolarını filtrele
    const dayTables = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ', 'PAZAR'];
    const depolomaTables = [
      'AKSU', 'MEYDAN', 'VARSAK ALTIAYAK', 'OTOGAR', 'VARSAK AKTARMA', 
      'ÜNSAL', 'SARISU', 'GÜRSU', 'ORGANİZE SANAYİ', 'TRT KAMPI', 
      'VARSAK', 'GÜZELOBA', 'KURŞUNLU ŞELALESİ', 'TERMİNAL', 
      'AKDENİZ ÜNİVERSİTESİ', 'KEPEZ KAYMAKAMLIĞI', 'VARSAK BELEDİYE', 
      'DEEPO AVM', 'ŞEHİR HASTANESİ', 'ANTOBÜS'
    ];
    
    // Sonuçları işle
    const tables = (data || [])
      .map(row => row.tablename ? row.tablename.trim() : null)
      .filter(name => 
        name && 
        !name.startsWith('pg_') && 
        !name.startsWith('_') && 
        !dayTables.includes(name) &&
        !depolomaTables.includes(name)
      )
      .sort();

    console.log(`✅ Found ${tables.length} tables:`, tables);

    return res.status(200).json({
      success: true,
      tables: tables,
      count: tables.length
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Hata: ' + err.message });
  }
}
