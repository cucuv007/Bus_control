# 🚀 Basit Sunucu ile Çalıştırma (npm gerektirmez)

Bu yöntemle **npm olmadan** sadece **Python** kullanarak projeyi çalıştırabilirsiniz.

---

## 📋 Gereksinimler

- Python 3.7+ yüklü olmalı
- Tarayıcı (Chrome, Firefox, Edge)

---

## ⚡ Hızlı Başlangıç

### 1. Python Kurulu mu Kontrol Et

```powershell
python --version
```

Eğer kurulu değilse: https://www.python.org/downloads/ adresinden indirin.

---

### 2. Gerekli Paketleri Yükle

```powershell
pip install flask flask-cors requests
```

**VEYA** requirements dosyası ile:

```powershell
pip install -r simple_requirements.txt
```

---

### 3. Sunucuyu Başlat

```powershell
python simple_server.py
```

✅ Çıktı şöyle olmalı:
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

---

### 4. Tarayıcıda Aç

Tarayıcınızda şu adresi açın:

```
http://localhost:5000
```

✅ Giriş yapın ve kullanmaya başlayın!

---

## 🛑 Sunucuyu Durdurma

PowerShell'de:
```
Ctrl + C
```

---

## 🔧 Sorun Giderme

### Problem: "pip: command not found"
**Çözüm:**
```powershell
python -m pip install flask flask-cors requests
```

### Problem: "Port 5000 already in use"
**Çözüm:** `simple_server.py` dosyasında son satırı şu şekilde değiştirin:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```
Sonra `http://localhost:5001` adresini kullanın.

### Problem: "Access denied" veya 401 hatası
**Çözüm:** Supabase'de Danger tablosu için RLS politikası gerekli.
`DANGER_RLS_POLICY.sql` dosyasını Supabase SQL Editor'da çalıştırın.

---

## 📁 Dosya Yapısı

```
BusControl_Düzenli/
├── simple_server.py          # Python Flask sunucusu
├── simple_requirements.txt   # Python paketleri
├── public/
│   ├── code.html            # Ana sayfa
│   ├── app.js               # JavaScript
│   └── style.css            # CSS
└── DANGER_RLS_POLICY.sql    # Supabase RLS politikası
```

---

## 🎯 Özellikler

✅ **npm gerektirmez** - Sadece Python kullanır
✅ **Kolay kurulum** - 3 komut ile çalışır
✅ **Danger tablosu** - Zamanları görüntüler ve günceller
✅ **Service Role Key** - RLS bypass eder
✅ **CORS desteği** - Tüm tarayıcılarda çalışır

---

## ⚠️ Güvenlik Notu

`simple_server.py` dosyasında **Supabase Service Role Key** var.
Bu key çok güçlü yetkiler verir, **sadece yerel geliştirme için kullanın**.

Production ortamında:
1. Service Role Key'i `.env` dosyasına taşıyın
2. `.env` dosyasını `.gitignore`'a ekleyin
3. Ortam değişkenlerinden okuyun

---

## 📞 Yardım

Sorun yaşıyorsanız:
1. Python sürümünü kontrol edin: `python --version`
2. Paketlerin yüklü olduğunu kontrol edin: `pip list | findstr flask`
3. Sunucu loglarını okuyun (terminal çıktısı)

---

**Kolay gelsin! 🎉**
