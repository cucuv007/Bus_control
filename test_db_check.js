// Check SA65 table data
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.vhxjyfappvmtwfdkhkoc:kGGfaPiNoA7K1b6g@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT "Plaka", "Tarife_Saati", "Onaylanan", "Hareket"
      FROM public."SA65"
      WHERE "Hareket" = 'Kalkış'
      ORDER BY "Tarife_Saati"
      LIMIT 10
    `);
    
    console.log('SA65 Kalkış Rows:');
    console.log('=================');
    result.rows.forEach(row => {
      console.log(`Plaka: ${row.Plaka}, Tarife: ${row.Tarife_Saati}, Onaylanan: ${row.Onaylanan || 'NULL'}`);
    });
    
    console.log('\nTarife_Saati tipi:', typeof result.rows[0].Tarife_Saati);
    console.log('Onaylanan tipi:', typeof result.rows[0].Onaylanan);
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkData().catch(console.error);
