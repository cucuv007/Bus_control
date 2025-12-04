-- Danger Tablosu için Row Level Security (RLS) Ayarları
-- Supabase SQL Editor'da bu kodu çalıştırın

-- =====================================================
-- HIZLI ÇÖZÜM: RLS'i Tamamen Kapat (Frontend Service Key kullanıyor)
-- =====================================================

ALTER TABLE "Danger" DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VEYA GÜVENLİ ÇÖZÜM: RLS Politikaları (Önerilen)
-- =====================================================

/*
-- 1. RLS'i etkinleştir
ALTER TABLE "Danger" ENABLE ROW LEVEL SECURITY;

-- 2. Herkes için okuma izni
CREATE POLICY "Enable read access for all users" 
ON "Danger"
FOR SELECT
USING (true);

-- 3. Authenticated kullanıcılar için güncelleme izni
CREATE POLICY "Enable update access for authenticated users" 
ON "Danger"
FOR UPDATE
USING (true)
WITH CHECK (true);

-- 4. Authenticated kullanıcılar için insert izni (gerekirse)
CREATE POLICY "Enable insert access for authenticated users" 
ON "Danger"
FOR INSERT
WITH CHECK (true);
*/
