# 🎯 npm Olmadan Çalıştırma - Adım Adım Kılavuz

## ✅ Tamamlandı!

Artık **npm gerektirmeden** projeyi çalıştırabilirsiniz!

---

## 📦 Oluşturulan Dosyalar

1. **simple_server.py** - Python Flask sunucusu (Ana dosya)
2. **simple_requirements.txt** - Python paket listesi
3. **start_server.bat** - Windows batch dosyası (Çift tıkla başlat)
4. **start_server.ps1** - PowerShell script
5. **SIMPLE_SERVER_README.md** - Detaylı kullanım kılavuzu
6. **DANGER_RLS_POLICY.sql** - Supabase RLS politikası

---

## 🚀 3 Adımda Başlat

### Yöntem 1: Batch Dosyası (EN KOLAY)

1. **start_server.bat** dosyasına çift tıklayın
2. Gerekli paketler otomatik yüklenecek
3. Tarayıcıda `http://localhost:5000` açın

### Yöntem 2: PowerShell

```powershell
.\start_server.ps1
```

### Yöntem 3: Manuel

```powershell
# 1. Paketleri yükle (ilk seferinde)
pip install -r simple_requirements.txt

# 2. Sunucuyu başlat
python simple_server.py

# 3. Tarayıcıda aç
# http://localhost:5000
```

---

## 📋 İlk Kurulum (Tek Seferlik)

### Python Kontrolü

```powershell
python --version
```

✅ Python 3.7+ olmalı. Yoksa: https://www.python.org/downloads/

### Paket Kurulumu

```powershell
pip install flask flask-cors requests
```

**VEYA**

```powershell
pip install -r simple_requirements.txt
```

---

## 🎮 Kullanım

### Sunucuyu Başlatma

```powershell
python simple_server.py
```

Şu mesajı göreceksiniz:
```
============================================================
🚀 Flask Sunucusu Başlatılıyor...
============================================================
📍 URL: http://localhost:5000
📁 Static: public/code.html
🔌 API Endpoints:
   - GET  /api/get-danger-times
   - POST /api/update-danger-time
============================================================
⚠️  Durdurmak için: Ctrl+C
============================================================
 * Running on http://0.0.0.0:5000
```

### Tarayıcıda Açma

Chrome/Firefox/Edge'de:
```
http://localhost:5000
```

### Sunucuyu Durdurma

Terminal/PowerShell'de:
```
Ctrl + C
```

---

## 🔧 Danger Tablosu Ayarları

### Supabase RLS Politikası (Gerekli!)

401 hatasını önlemek için Supabase'de şu SQL'i çalıştırın:

```sql
ALTER TABLE "Danger" DISABLE ROW LEVEL SECURITY;
```

**VEYA** (Daha güvenli):

```sql
ALTER TABLE "Danger" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON "Danger" FOR SELECT USING (true);

CREATE POLICY "Enable update access for authenticated users" 
ON "Danger" FOR UPDATE USING (true) WITH CHECK (true);
```

Detaylı SQL: **DANGER_RLS_POLICY.sql** dosyasına bakın.

---

## 🎯 Özellikler

### ✅ Çalışan Özellikler

- ✅ Hat listesi görüntüleme
- ✅ Danger tablosundan uyarı zamanlarını çekme
- ✅ Hat yanında zaman gösterimi (örn: `104       00:30`)
- ✅ Çoklu hat seçimi
- ✅ Toplu zaman güncelleme
- ✅ Otomatik format (0130 → 01:30)
- ✅ Gerçek zamanlı önizleme

### 🔌 API Endpoint'leri

1. **GET /api/get-danger-times**
   - Tüm Danger zamanlarını getirir
   - Response: `{success: true, data: {104: "00:30:00", ...}}`

2. **POST /api/update-danger-time**
   - Seçili hatların zamanlarını günceller
   - Body: `{hatNames: ["104", "106"], uyariTime: "00:30"}`
   - Response: `{success: true, message: "2 hat güncellendi"}`

---

## 🐛 Sorun Giderme

### Problem: "pip: command not found"

```powershell
python -m pip install -r simple_requirements.txt
```

### Problem: "Port 5000 already in use"

**Çözüm 1:** Başka portu kullanan uygulamayı kapatın

**Çözüm 2:** `simple_server.py` son satırını değiştirin:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```
Sonra `http://localhost:5001` kullanın.

### Problem: 401 Unauthorized

Supabase'de RLS politikası gerekli. `DANGER_RLS_POLICY.sql` çalıştırın.

### Problem: "ModuleNotFoundError: No module named 'flask'"

```powershell
pip install flask flask-cors requests
```

### Problem: Danger zamanları görünmüyor

1. Supabase SQL Editor'da kontrol edin: `SELECT * FROM "Danger" LIMIT 5;`
2. RLS politikasını kontrol edin
3. Service Role Key'in doğru olduğundan emin olun

---

## 📊 Test

### Danger Tablosu Kontrolü

Tarayıcı Console'da (F12):
```javascript
fetch('http://localhost:5000/api/get-danger-times')
  .then(r => r.json())
  .then(d => console.log(d));
```

Beklenen çıktı:
```json
{
  "success": true,
  "data": {
    "104": "00:30:00",
    "106": "00:25:00",
    ...
  }
}
```

---

## ⚠️ Önemli Notlar

1. **Service Role Key** `simple_server.py` içinde var
   - Bu key çok güçlü, **sadece lokal kullanım için**
   - Production'da environment variable kullanın

2. **CORS aktif** - Tüm origin'lerden erişim var
   - Lokal geliştirme için normal
   - Production'da kısıtlayın

3. **Debug mode açık** - Kod değişikliklerinde otomatik yeniden başlar

---

## 🎉 Başarılı Kurulum Kontrolü

✅ Python kurulu
✅ Paketler yüklü (flask, flask-cors, requests)
✅ Sunucu çalışıyor (http://localhost:5000)
✅ Giriş sayfası açılıyor
✅ Hat listesi görünüyor
✅ Danger zamanları görünüyor
✅ Set Time butonu çalışıyor

---

## 📞 Destek

Sorun yaşıyorsanız:

1. Terminal çıktısını okuyun
2. Tarayıcı Console'u kontrol edin (F12)
3. Python sürümünü kontrol edin: `python --version`
4. Paketleri kontrol edin: `pip list`

---

**🎊 Artık npm olmadan çalışıyor! Keyifli kullanımlar! 🎊**
