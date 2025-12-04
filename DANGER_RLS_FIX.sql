-- Danger Tablosu RLS Tamamen Kaldırma
-- Supabase SQL Editor'da BÜTÜN BU SATIRLARI birlikte çalıştırın

-- 1. Önce tüm mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable read access for all users" ON "Danger";
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON "Danger";
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON "Danger";
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON "Danger";

-- 2. RLS'i tamamen kapat
ALTER TABLE "Danger" DISABLE ROW LEVEL SECURITY;

-- 3. Kontrol için test sorgusu
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'Danger';

-- Beklenen sonuç: rowsecurity = false olmalı
-- Eğer rowsecurity = true ise, RLS hala aktif demektir

-- 4. Politikaları kontrol et (boş dönmeli)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'Danger';

-- Beklenen sonuç: Hiç satır dönmemeli (tablo boş olmalı)
