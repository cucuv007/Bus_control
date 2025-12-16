# VTS Otomatik Onaylama Sistemi

## 📋 Genel Bakış

SA65 hattı için VTS (Kentkart) sisteminden gerçek zamanlı geçiş verilerini çekerek, `Onaylanan` sütununu otomatik olarak dolduran entegrasyon.

## 🎯 Özellikler

### 1. Otomatik VTS Veri Çekme
- SA65 hattındaki tüm aktif araçları tespit eder
- Bugün saat 06:00'dan itibaren tüm geçmiş konum verilerini çeker
- Her araç için ayrı ayrı analiz yapar

### 2. 500m Lineer Artış Algoritması
Gelişmiş geçiş tespiti mantığı:
- **Yaklaşma Fazı**: Araç durağa yaklaşırken mesafe azalır
- **Durak Noktası**: En yakın mesafe kaydedilir
- **Uzaklaşma Fazı**: Araç duraktan uzaklaşırken mesafe artar
- **Geçiş Tespiti**: Mesafe 500m'yi geçtiğinde geçiş olarak kaydedilir

Bu mantık, duran araçların yanlış geçiş olarak sayılmasını engeller (299 yanlış pozitif → 7-10 gerçek geçiş).

### 3. Akıllı Eşleştirme (±30 Dakika)
VTS'den gelen gerçek geçiş zamanları, veritabanındaki `Tarife_Saati` ile eşleştirilir:

**Öncelik 1: Plaka Eşleşmesi**
- Gerçek plaka ile veritabanındaki plaka eşleşirse
- ±30 dakika içinde en yakın zaman bulunur

**Öncelik 2: Belediye Aracı**
- Plaka eşleşmezse "Belediye Aracı" satırlarına bakar
- Henüz doldurulmamış satırlardan en yakın zamanı seçer
- ±30 dakika tolerans uygulanır

### 4. Otomatik Veritabanı Güncelleme
- Eşleşen satırların `Onaylanan` sütunu güncellenir
- Gerçek geçiş zamanı (HH:MM:SS formatında) yazılır
- Kullanıcıya detaylı rapor gösterilir

## 🚀 Kullanım

### Adım 1: Hat Seçimi
1. Vercel uygulamasında (bus-control-4i5o.vercel.app)
2. Sol panelden "SA65" hattını seçin
3. "⏱️ Seçili Hatları Takip Et" butonuna tıklayın

### Adım 2: Otomatik İşlem
Sistem otomatik olarak:
1. VTS'ye bağlanır
2. SA65 araçlarını tespit eder (örn: 07BGV036, 07AU0027, 07AU0337...)
3. Bugünkü geçiş kayıtlarını analiz eder
4. Veritabanını günceller
5. Sonuçları gösterir

### Örnek Çıktı
```
✅ VTS Otomatik Onay

7 satır otomatik onaylandı

Detaylar:
07AU0274 - T01 → 06:52:10
07AU0337 - T02 → 07:29:00
07AU0414 - T03 → 07:40:55
07AU0107 - T04 → 08:47:25
07BGV036 - T05 → 09:36:00
07AU0274 - T06 → 10:52:25
07AU0337 - T07 → 11:29:45
```

## 🔧 Teknik Detaylar

### Dosyalar
- **API Endpoint**: `pages/api/vts-auto-populate-onaylanan.js`
- **Frontend Handler**: `public/app.js` (handleApplyHatSelection fonksiyonu)
- **Test Script**: `vts_history_scraper_v2.py` (Python referans implementasyonu)

### VTS API Endpoints
1. **latestdevicedata/get**: SA65 araçlarını listeler
2. **historicdevicedata/get**: Geçmiş konum verilerini çeker

### Veritabanı
- **Tablo**: `public."SA65"`
- **Güncellenen Sütun**: `Onaylanan`
- **Filtre**: `Hareket = 'Kalkış'`

### Koordinatlar
- **Durak**: Sarısu Depolama Merkezi-1
- **Enlem**: 36.830802°N
- **Boylam**: 30.596277°E

## ⚙️ Konfigürasyon

### Environment Variables
Vercel projesinde şu değişkenler tanımlı olmalı:
```bash
DATABASE_URL=postgresql://...
VTS_ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Güncelleme
VTS token'ı süresi dolduğunda:
1. https://vts.kentkart.com.tr adresine giriş yapın
2. F12 → Application → Cookies
3. `access_token` değerini kopyalayın
4. `pages/api/vts-auto-populate-onaylanan.js` dosyasında güncelleyin
5. Alternatif: `VTS_ACCESS_TOKEN` environment variable'ını güncelleyin

## 📊 Performans

### Zaman Aralığı
- Başlangıç: Bugün 06:00
- Bitiş: Şu anki zaman
- Tipik süre: 06:00-12:00 arası ~6 saat veri

### İşlem Süresi
- 6 araç için: ~10-15 saniye
- API timeout: 60 saniye
- Bağlantı pool: Max 20

### Doğruluk
- Yanlış pozitif oranı: %99 azalma (500m eşiği sayesinde)
- Eşleşme başarısı: ~%95 (±30 dakika tolerans)

## 🐛 Sorun Giderme

### "SA65 araçları VTS'de bulunamadı"
- VTS token'ının süresi dolmuş olabilir
- VTS sisteminde SA65 hattı aktif değil
- Ağ bağlantısı sorunu

**Çözüm**: Token'ı güncelleyin, VTS sistemini kontrol edin

### "VTS history error: 401"
- Token geçersiz veya süresi dolmuş

**Çözüm**: Yeni token alın ve `VTS_ACCESS_TOKEN` değişkenini güncelleyin

### "0 geçiş tespit edildi"
- Bugün henüz araç hareket etmemiş
- Zaman aralığı dışında kalmış
- Tüm araçlar park halinde (hareket < 5m)

**Çözüm**: Saati kontrol edin, araç hareketlerini doğrulayın

### "updated: 0" (geçiş var ama eşleşme yok)
- Tarife saatleri VTS zamanlarıyla eşleşmiyor (±30 dak dışında)
- Tüm uygun satırlar zaten dolu
- Plaka uyuşmazlığı

**Çözüm**: Tarife saatlerini kontrol edin, "Belediye Aracı" satırları ekleyin

## 📝 Notlar

- Sistem sadece `Hareket = 'Kalkış'` satırlarını günceller
- Zaten dolu `Onaylanan` sütunlarını değiştirmez
- "Belediye Aracı" satırları esnek eşleştirme için kullanılır
- Her buton tıklamasında bugünün tüm verileri yeniden analiz edilir

## 🔮 Gelecek Geliştirmeler

- [ ] Diğer hatlar için destek (SA64, SA66...)
- [ ] Birden fazla durak kontrolü
- [ ] Geçmiş günler için analiz
- [ ] Real-time bildirimler (WebSocket)
- [ ] Detaylı raporlama ekranı
- [ ] Token otomatik yenileme
