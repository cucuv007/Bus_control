# VTS Real-time Pusher Kurulum

## Gereksinimler
- Python 3.7+
- `requests` kütüphanesi

## Kurulum

```bash
pip install requests
```

## Yapılandırma

1. **VTS'ye giriş yapın** (Chrome): `https://vts.kentkart.com.tr`

2. **Cookie'leri alın:**
   - F12 → Application → Cookies → vts.kentkart.com.tr
   - `JSESSIONID`, `session` veya benzeri cookie'leri kopyalayın

3. **vts_realtime_pusher.py dosyasını düzenleyin:**

```python
VTS_COOKIES = {
    'JSESSIONID': 'BURAYA_JSESSIONID_DEGERINI_YAPISTIRIN',
    'session': 'BURAYA_SESSION_DEGERINI_YAPISTIRIN'
}
```

## Çalıştırma

```bash
python vts_realtime_pusher.py
```

## Ne Yapar?

1. Her 5 saniyede VTS API'den SA65 araçlarını çeker
2. Koordinat, hız, durum bilgilerini alır
3. Bus Control API'ye POST eder
4. Web sayfası otomatik güncellenir

## Test

Web sayfasını açın:
```
https://bus-control-4i5o.vercel.app/test_kentkart_vts.html
```

"Otomatik Yenileme Başlat" butonuna tıklayın.

## Çıktı Örneği

```
[14:23:45] 🔄 İterasyon #12
✅ VTS: 3174 toplam, 8 SA65 araç
  🟢 07MKL09: Lat=36.907342, Lon=30.670412, Hız=0 km/h
  🟢 07MKL43: Lat=36.908052, Lon=30.670243, Hız=15 km/h
  ...
✅ Bus Control API: 8 araç gönderildi
⏳ 5 saniye bekleniyor...
```

## Durdurma

`Ctrl+C` tuşlarına basın.

## Notlar

- Script bilgisayarınızda çalışmalı (VTS cookie'leri gerekli)
- Internet bağlantısı gerekli
- Python script kapanırsa web sayfası eski veriyi gösterir
- 30 saniyeden eski veri "stale" olarak işaretlenir
