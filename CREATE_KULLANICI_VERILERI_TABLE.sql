-- Kullanıcı_Verileri tablosunu oluştur
CREATE TABLE IF NOT EXISTS public."Kullanıcı_Verileri" (
  "id" SERIAL PRIMARY KEY,
  "Kullanıcı" TEXT NOT NULL,
  "Görev" TEXT,
  "Şifre" TEXT NOT NULL
);

-- RLS (Row Level Security) kapat
ALTER TABLE public."Kullanıcı_Verileri" DISABLE ROW LEVEL SECURITY;

-- İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_kullanici_verileri_kullanici ON public."Kullanıcı_Verileri"("Kullanıcı");
CREATE INDEX IF NOT EXISTS idx_kullanici_verileri_gorev ON public."Kullanıcı_Verileri"("Görev");

-- Başarı mesajı
SELECT 'Kullanıcı_Verileri tablosu başarıyla oluşturuldu!' AS message;
