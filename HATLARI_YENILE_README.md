# Hatları Yenile Özelliği - Kurulum ve Kullanım

## 🎯 Özellik Özeti

"Hatları Yenile" butonu tıklandığında:

1. ✅ Mevcut listeyi Excel dosyası olarak kaydeder
2. ✅ Liste ekranının görüntüsünü alır
3. ✅ Kullanıcılar tablosundaki tüm mail adreslerine gönderir
4. ✅ Mail başarılıysa → Onaylanan ve Durum sütunlarını temizler
5. ✅ Mail başarısızsa → İşlem iptal edilir
6. ✅ Masaüstüne (Downloads) dosyaları kaydeder

## 📦 Kurulum

### 1. Paketleri Yükle

```bash
npm install
```

### 2. .env Dosyasını Oluştur

`.env` dosyanızda SMTP ayarlarını ekleyin:

```env
# SMTP Settings (Gmail örneği)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sizin@gmail.com
SMTP_PASS=uygulama_sifreniz
```

**Gmail için App Password oluşturma:**
1. Google hesabınıza gidin: https://myaccount.google.com/apppasswords
2. "App passwords" seçeneğini seçin
3. "Mail" için bir şifre oluşturun
4. Oluşturulan 16 karakterli şifreyi `SMTP_PASS` olarak kullanın

### 3. Kullanıcılar Tablosunu Oluştur

Supabase SQL Editor'da şu kodu çalıştırın:

```sql
CREATE TABLE IF NOT EXISTS public."Kullanıcılar" (
  "id" SERIAL PRIMARY KEY,
  "Kullanıcı" text NOT NULL,
  "mail" text NOT NULL UNIQUE
);

ALTER TABLE public."Kullanıcılar" DISABLE ROW LEVEL SECURITY;

-- Örnek veri
INSERT INTO public."Kullanıcılar" ("Kullanıcı", "mail") VALUES
('Admin', 'admin@example.com'),
('Operatör 1', 'operator1@example.com')
ON CONFLICT ("mail") DO NOTHING;
```

## 🚀 Kullanım

1. Hat seç ve listele
2. "Hatları Yenile" butonuna tıkla
3. Onay ver
4. Sistem:
   - Excel oluşturur
   - Ekran görüntüsü alır
   - Mailleri gönderir
   - Başarılıysa veritabanını temizler
   - Dosyaları indirir

## 📁 Oluşturulan Dosyalar

### API Endpoints:
- `/api/get-users.js` - Kullanıcıları getirir
- `/api/clear-status.js` - Onaylanan/Durum sütunlarını temizler
- `/api/send-refresh-email.js` - Mail gönderir

### Frontend:
- "Hatları Yenile" butonu (kırmızı)
- `handleRefreshHats()` fonksiyonu

## ⚠️ Önemli Notlar

1. **Mail gönderiminde hata varsa** temizleme yapılmaz
2. **Tablo seçimi kaldırıldı** - sadece hat seçimi var
3. **Dosyalar tarayıcıdan indirilir** - masaüstüne otomatik kayıt yapılamaz (güvenlik kısıtlaması)
4. **SMTP ayarları zorunlu** - yoksa mail gönderilemez

## 🧪 Test

1. Kullanıcılar tablosuna kendi mailinizi ekleyin
2. Bir hat seçip listeleyin
3. "Hatları Yenile" butonuna tıklayın
4. Mailinizi kontrol edin

## 🐛 Sorun Giderme

**Mail gitmiyor:**
- `.env` dosyasındaki SMTP ayarlarını kontrol edin
- Gmail App Password kullandığınızdan emin olun
- Console'da hata mesajlarını kontrol edin

**Dosyalar indirilmiyor:**
- Tarayıcı indirme iznini kontrol edin
- Pop-up engelleyiciyi kapatın

**Temizleme çalışmıyor:**
- Console'da SQL hatalarını kontrol edin
- Hat adlarının doğru olduğundan emin olun
