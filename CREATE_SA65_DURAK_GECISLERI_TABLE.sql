-- SA65 Durak Geçiş Kayıtları Tablosu
-- Sarısu Depolama Merkezi-1 durak geçişlerini kaydeder

CREATE TABLE IF NOT EXISTS public."SA65_Durak_Gecisleri" (
    "ID" SERIAL PRIMARY KEY,
    "Plaka" VARCHAR(20) NOT NULL,
    "Durak_Adi" VARCHAR(100) NOT NULL,
    "Durak_Enlem" DECIMAL(10, 8) NOT NULL,
    "Durak_Boylam" DECIMAL(11, 8) NOT NULL,
    "Gecis_Tarihi" DATE NOT NULL,
    "Gecis_Saati" TIME NOT NULL,
    "Gecis_Timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Arac_Enlem" DECIMAL(10, 8),
    "Arac_Boylam" DECIMAL(11, 8),
    "Arac_Hiz" INTEGER,
    "Mesafe_Metre" DECIMAL(10, 2),
    "Hat_Kodu" VARCHAR(20),
    "Rota" VARCHAR(200),
    "Surucu_Adi" VARCHAR(100),
    "Sirket" VARCHAR(200),
    "Kayit_Tipi" VARCHAR(20) DEFAULT 'realtime', -- 'realtime' veya 'historical'
    CONSTRAINT unique_gecis UNIQUE ("Plaka", "Durak_Adi", "Gecis_Tarihi", "Gecis_Saati")
);

-- İndeksler (hızlı sorgulama için)
CREATE INDEX IF NOT EXISTS idx_sa65_gecis_plaka ON public."SA65_Durak_Gecisleri" ("Plaka");
CREATE INDEX IF NOT EXISTS idx_sa65_gecis_tarih ON public."SA65_Durak_Gecisleri" ("Gecis_Tarihi");
CREATE INDEX IF NOT EXISTS idx_sa65_gecis_timestamp ON public."SA65_Durak_Gecisleri" ("Gecis_Timestamp");
CREATE INDEX IF NOT EXISTS idx_sa65_gecis_durak ON public."SA65_Durak_Gecisleri" ("Durak_Adi");

-- Yorum ekle
COMMENT ON TABLE public."SA65_Durak_Gecisleri" IS 'SA65 hattı araçlarının durak geçiş kayıtları. Geofence algoritması ile tespit edilir.';
COMMENT ON COLUMN public."SA65_Durak_Gecisleri"."Mesafe_Metre" IS 'Aracın durak merkezine olan uzaklığı (metre cinsinden)';
COMMENT ON COLUMN public."SA65_Durak_Gecisleri"."Kayit_Tipi" IS 'realtime: Canlı takipten, historical: Geçmiş veri analizinden';
