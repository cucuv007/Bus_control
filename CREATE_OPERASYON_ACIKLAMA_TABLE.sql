-- Operasyon_Açıklama tablosunu oluştur
CREATE TABLE IF NOT EXISTS public."Operasyon_Açıklama" (
  "id" SERIAL PRIMARY KEY,
  "Hat_Adi" TEXT,
  "Çalışma_Zamanı" TEXT,
  "Tarife" TEXT,
  "Tarife_Saati" TIME,
  "Plaka" TEXT,
  "Açıklama" TEXT,
  "Tarih" TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) kapat
ALTER TABLE public."Operasyon_Açıklama" DISABLE ROW LEVEL SECURITY;

-- İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_operasyon_aciklama_hat_adi ON public."Operasyon_Açıklama"("Hat_Adi");
CREATE INDEX IF NOT EXISTS idx_operasyon_aciklama_tarife ON public."Operasyon_Açıklama"("Tarife");
CREATE INDEX IF NOT EXISTS idx_operasyon_aciklama_plaka ON public."Operasyon_Açıklama"("Plaka");

-- Başarı mesajı
SELECT 'Operasyon_Açıklama tablosu başarıyla oluşturuldu!' AS message;
