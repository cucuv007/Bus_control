-- =====================================================
-- TAKİP TABLOSU RLS'İNİ KAPAT
-- =====================================================
-- Supabase SQL Editor'da bu komutları çalıştırın

-- 1. RLS'İ KAPAT
ALTER TABLE public."Takip" DISABLE ROW LEVEL SECURITY;

-- 2. TÜM POLİTİKALARI SİL (varsa)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'Takip'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public."Takip"', pol.policyname);
        RAISE NOTICE 'Silindi: %', pol.policyname;
    END LOOP;
END $$;

-- 3. KONTROL: RLS kapalı mı?
SELECT 
    tablename, 
    rowsecurity as "RLS_AKTIF_MI"
FROM pg_tables 
WHERE tablename = 'Takip';

-- Beklenen: rowsecurity = false (f)

-- 4. KONTROL: Politika var mı?
SELECT COUNT(*) as "POLITIKA_SAYISI"
FROM pg_policies 
WHERE tablename = 'Takip';

-- Beklenen: 0

-- 5. TEST: Veri okuma
SELECT "id", "Name", "Uyarı" 
FROM public."Takip" 
LIMIT 5;

-- =====================================================
-- ✅ BAŞARILI!
-- =====================================================
-- Artık test_danger.html sayfasını yenile ve test et!
