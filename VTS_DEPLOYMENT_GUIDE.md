# VTS Otomatik Onaylama - Deployment Guide

## 🚀 Vercel'e Deploy Etme

### Adım 1: Dosyaları Hazırla
Aşağıdaki dosyalar eklenmiş/güncellenmiş durumda:

**Yeni Dosyalar:**
- ✅ `pages/api/vts-auto-populate-onaylanan.js` - API endpoint
- ✅ `VTS_AUTO_POPULATE_README.md` - Dokümantasyon
- ✅ `test_vts_auto_populate.js` - Test script

**Güncellenen Dosyalar:**
- ✅ `public/app.js` - SA65 için otomatik VTS çağrısı eklendi

### Adım 2: GitHub'a Push
```bash
git add pages/api/vts-auto-populate-onaylanan.js
git add public/app.js
git add VTS_AUTO_POPULATE_README.md
git add test_vts_auto_populate.js
git commit -m "feat: VTS otomatik onaylama sistemi eklendi"
git push origin main
```

### Adım 3: Vercel Environment Variables
Vercel Dashboard'da şu değişkenleri kontrol edin:

**Mevcut Olması Gerekenler:**
```bash
DATABASE_URL=postgresql://...  # Supabase bağlantısı
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Yeni Eklenecek (Opsiyonel):**
```bash
VTS_ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Not**: Token hardcoded olarak `vts-auto-populate-onaylanan.js` içinde de var. Environment variable önceliklidir.

### Adım 4: Vercel Deploy
1. Vercel otomatik deploy başlatır (GitHub push sonrası)
2. Build loglarını kontrol edin
3. Deploy tamamlandıktan sonra test edin

## 🧪 Test Etme

### Lokal Test (Deploy Öncesi)
```bash
# 1. VTS API bağlantısını test et
node test_vts_auto_populate.js

# 2. Next.js sunucusunu başlat
npm run dev

# 3. Tarayıcıda test et
# http://localhost:3000 → SA65 seçimi
```

### Production Test (Deploy Sonrası)
1. https://bus-control-4i5o.vercel.app adresine git
2. Giriş yap
3. Sol panelden **SA65** seçimi yap
4. **"⏱️ Seçili Hatları Takip Et"** butonuna tıkla
5. Popup'ta VTS sonuçlarını kontrol et:
   ```
   ✅ VTS Otomatik Onay
   
   7 satır otomatik onaylandı
   
   Detaylar:
   07AU0274 - T01 → 06:52:10
   ...
   ```

### API Endpoint Direkt Test
```bash
# Vercel'de
curl -X POST https://bus-control-4i5o.vercel.app/api/vts-auto-populate-onaylanan \
  -H "Content-Type: application/json" \
  -d '{"hat":"SA65"}'
```

Beklenen Yanıt:
```json
{
  "success": true,
  "message": "7 satır otomatik onaylandı",
  "updated": 7,
  "crossings": 7,
  "vehicles": 6,
  "details": [
    {
      "plaka": "07AU0274",
      "tarife": "06:30:00",
      "gerceklesen": "06:52:10",
      "mesafe": "10.1m"
    },
    ...
  ]
}
```

## 🔧 Sorun Giderme

### Deploy Hataları

**Build Error: Module not found**
```bash
# Çözüm: package.json'da bağımlılıklar eksiksiz mi?
npm install
```

**Environment Variable Hatası**
```bash
# Vercel Dashboard → Settings → Environment Variables
# DATABASE_URL ve diğer değişkenleri kontrol edin
```

### Runtime Hataları

**"SA65 araçları VTS'de bulunamadı"**
- Token süresi dolmuş → Yeni token alın
- VTS API down → https://vts.kentkart.com.tr kontrol edin

**"VTS history error: 401"**
- Token geçersiz → `VTS_ACCESS_TOKEN` güncelleyin
- Token hardcoded → Dosyadaki token'ı güncelleyin

**"updated: 0" (geçiş var ama eşleşme yok)**
- Tarife saatleri uyuşmuyor → `SELECT * FROM "SA65" WHERE "Hareket"='Kalkış'` kontrol edin
- Zaman toleransı yetersiz → ±30 dakika genişletin

### Database Hataları

**"Table 'SA65' does not exist"**
```sql
-- Tablo var mı kontrol et
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SA65';

-- Yoksa oluştur (örnek)
CREATE TABLE "SA65" (
  id SERIAL PRIMARY KEY,
  "Hat_Adi" VARCHAR(50),
  "Tarife_Saati" VARCHAR(10),
  "Plaka" VARCHAR(20),
  "Onaylanan" VARCHAR(10),
  "Hareket" VARCHAR(20)
);
```

**"Column 'Onaylanan' does not exist"**
```sql
-- Sütunu ekle
ALTER TABLE "SA65" ADD COLUMN "Onaylanan" VARCHAR(10);
```

## 📊 Monitoring

### Vercel Logs
```bash
# Vercel CLI ile log izleme
vercel logs --follow

# Veya Vercel Dashboard'dan
# Project → Deployments → Latest → Runtime Logs
```

### Önemli Log Mesajları
```javascript
// Başarılı
'✅ 6 SA65 aracı bulundu'
'📊 Toplam 7 geçiş tespit edildi'
'✅ 7 satır güncellendi'

// Uyarı
'⚠️ Veri alınamadı'
'⚠️ 0 geçiş tespit edildi'

// Hata
'❌ VTS API error: 401'
'❌ SA65 araçları VTS\'de bulunamadı'
```

### Database Query Monitoring
```sql
-- Son güncellemeleri kontrol et
SELECT "Plaka", "Tarife_Saati", "Onaylanan"
FROM "SA65"
WHERE "Onaylanan" IS NOT NULL
ORDER BY "Tarife_Saati" DESC
LIMIT 20;

-- Bugün kaç satır güncellendi?
SELECT COUNT(*)
FROM "SA65"
WHERE "Onaylanan" IS NOT NULL
  AND "Onaylanan" != '';
```

## 🔄 Token Yenileme

VTS token'ı ~48 saat geçerlidir. Süre dolduğunda:

### Manuel Yenileme
1. https://vts.kentkart.com.tr → Giriş yap
2. F12 → Application → Cookies
3. `access_token` değerini kopyala
4. Vercel Dashboard → Environment Variables → `VTS_ACCESS_TOKEN` güncelle
5. Vercel'de redeploy: `Settings → Deployments → Redeploy`

### Otomatik Yenileme (Gelecek Özellik)
```javascript
// TODO: Token refresh endpoint
// GET /api/vts-refresh-token
// POST https://vts.kentkart.com.tr/api/026/v1/auth/refresh
```

## 📈 Performans Optimizasyonu

### API Response Time
- Normal: 10-15 saniye (6 araç)
- Yavaş: 20-30 saniye (ağ problemi)
- Timeout: 60 saniye

### Database Pool
```javascript
// vts-auto-populate-onaylanan.js
const pool = new Pool({
  max: 20,  // Maksimum bağlantı
  connectionTimeoutMillis: 60000,  // 60 saniye
});
```

### Caching (İsteğe Bağlı)
```javascript
// Redis ile cache
// GET vts:sa65:vehicles → 5 dakika cache
// GET vts:sa65:history:YYYYMMDD → 1 saat cache
```

## 🎯 Checklist

Deploy öncesi kontrol listesi:

- [ ] `test_vts_auto_populate.js` başarıyla çalıştı
- [ ] GitHub'a tüm dosyalar push edildi
- [ ] Vercel environment variables kontrol edildi
- [ ] Database tablo/sütunlar var
- [ ] VTS token geçerli (süresi dolmamış)
- [ ] Build başarılı
- [ ] Production'da SA65 butonu test edildi
- [ ] Console'da log mesajları kontrol edildi
- [ ] Database'de Onaylanan sütunu güncellenmiş

## 📞 Destek

Sorun yaşarsanız:
1. Vercel runtime logs kontrol edin
2. Database bağlantısını test edin
3. VTS token'ı yenileyin
4. `test_vts_auto_populate.js` çalıştırın
5. Bu dokümanı tekrar okuyun

**Acil Durum**: Eski sistem çalışmaya devam ediyor (manuel onaylama hala mevcut).
