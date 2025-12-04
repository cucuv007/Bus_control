-- =====================================================
-- DANGER TABLOSU RLS DURUMU KONTROLÜ VE DÜZELTME
-- =====================================================
-- Supabase SQL Editor'da bu komutları TEK TEK çalıştırın

-- 1. KONTROL: RLS durumu
SELECT 
    schemaname,
    tablename, 
    rowsecurity as "RLS_AÇIK_MI"
FROM pg_tables 
WHERE tablename = 'Danger';

-- Beklenen: rowsecurity = false
-- Eğer true ise, aşağıdaki adımları uygulayın


-- 2. TÜM POLİTİKALARI LİSTELE
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'Danger';

-- Eğer politika varsa, bunları silmemiz gerekiyor


-- 3. POLİTİKALARI SİL (hepsini birden)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'Danger'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON "Danger"', pol.policyname);
    END LOOP;
END $$;


-- 4. RLS'İ KAPAT
ALTER TABLE "Danger" DISABLE ROW LEVEL SECURITY;


-- 5. TEKRAR KONTROL
SELECT 
    tablename, 
    rowsecurity as "RLS_AÇIK_MI"
FROM pg_tables 
WHERE tablename = 'Danger';

-- Beklenen: rowsecurity = false


-- 6. POLİTİKA KONTROLÜ
SELECT COUNT(*) as "POLİTİKA_SAYISI"
FROM pg_policies 
WHERE tablename = 'Danger';

-- Beklenen: 0


-- =====================================================
-- SON TEST: Veri Okuma
-- =====================================================
SELECT "Name", "Uyarı" 
FROM "Danger" 
LIMIT 5;

-- Eğer bu sorgu çalışıyorsa, RLS başarıyla kapatılmıştır!
