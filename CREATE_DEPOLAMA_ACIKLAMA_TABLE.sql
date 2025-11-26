-- Depolama_Açıklama tablosunu oluştur
CREATE TABLE IF NOT EXISTS public."Depolama_Açıklama" (
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
ALTER TABLE public."Depolama_Açıklama" DISABLE ROW LEVEL SECURITY;

-- İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_depolama_aciklama_hat_adi ON public."Depolama_Açıklama"("Hat_Adi");
CREATE INDEX IF NOT EXISTS idx_depolama_aciklama_tarife ON public."Depolama_Açıklama"("Tarife");
CREATE INDEX IF NOT EXISTS idx_depolama_aciklama_plaka ON public."Depolama_Açıklama"("Plaka");

-- Başarı mesajı
SELECT 'Depolama_Açıklama tablosu başarıyla oluşturuldu!' AS message;
