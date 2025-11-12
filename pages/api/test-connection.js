// pages/api/test-connection.js
// Tüm bağlantıları test et

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
      supabaseUrlLength: process.env.SUPABASE_URL?.length || 0,
      supabaseKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    },
    tests: {}
  };

  // Test 1: Supabase Bağlantısı
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      results.tests.supabaseConnection = {
        success: false,
        error: 'Environment variables eksik'
      };
    } else {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Basit bir sorgu yap
      const { data, error } = await supabase
        .from('_test_nonexistent_table_')
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist - bu beklenen, bağlantı çalışıyor
        results.tests.supabaseConnection = {
          success: true,
          message: 'Bağlantı başarılı (tablo yok hatası beklenen)'
        };
      } else if (error) {
        results.tests.supabaseConnection = {
          success: false,
          error: error.message,
          code: error.code
        };
      } else {
        results.tests.supabaseConnection = {
          success: true,
          message: 'Bağlantı başarılı'
        };
      }
    }
  } catch (err) {
    results.tests.supabaseConnection = {
      success: false,
      error: err.message
    };
  }

  // Test 2: exec_sql fonksiyonu
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      results.tests.execSqlFunction = {
        success: false,
        error: 'Environment variables eksik'
      };
    } else {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'SELECT 1 as test;'
      });

      if (error) {
        results.tests.execSqlFunction = {
          success: false,
          error: error.message,
          hint: 'exec_sql fonksiyonunu Supabase SQL Editor\'de oluşturun'
        };
      } else {
        results.tests.execSqlFunction = {
          success: true,
          message: 'exec_sql fonksiyonu çalışıyor',
          data: data
        };
      }
    }
  } catch (err) {
    results.tests.execSqlFunction = {
      success: false,
      error: err.message
    };
  }

  // Test 3: get_table_names fonksiyonu
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      results.tests.getTableNamesFunction = {
        success: false,
        error: 'Environment variables eksik'
      };
    } else {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase.rpc('get_table_names');

      if (error) {
        results.tests.getTableNamesFunction = {
          success: false,
          error: error.message,
          hint: 'get_table_names fonksiyonunu Supabase SQL Editor\'de oluşturun'
        };
      } else {
        results.tests.getTableNamesFunction = {
          success: true,
          message: 'get_table_names fonksiyonu çalışıyor',
          tableCount: data?.length || 0,
          tables: data?.map(t => t.tablename).slice(0, 5) // İlk 5 tablo
        };
      }
    }
  } catch (err) {
    results.tests.getTableNamesFunction = {
      success: false,
      error: err.message
    };
  }

  // Genel sonuç
  const allTestsPassed = Object.values(results.tests).every(t => t.success);
  results.summary = {
    allPassed: allTestsPassed,
    passedCount: Object.values(results.tests).filter(t => t.success).length,
    totalCount: Object.keys(results.tests).length
  };

  return res.status(200).json(results);
}
