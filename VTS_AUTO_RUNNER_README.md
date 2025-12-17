# 🚍 VTS Otomatik Runner

VTS sistemine otomatik login yapıp, token'ı çekip, `vts_history_scraper_v2.py` script'ini otomatik çalıştıran sistem.

## 🎯 Özellikler

✅ **Tam Otomatik**: Tek tıkla tüm işlem
✅ **VTS Otomatik Login**: Kullanıcı adı/şifre ile otomatik giriş
✅ **Token Otomatik Çekme**: localStorage, Cookie veya Network'ten token yakalar
✅ **Script Otomatik Güncelleme**: Token'ı script'e otomatik yazar
✅ **Script Otomatik Çalıştırma**: 14 hat için tüm geçişleri otomatik onaylar

## 📋 Gereksinimler

```bash
pip install -r vts_auto_requirements.txt
```

Veya manuel:
```bash
pip install selenium webdriver-manager requests psycopg2-binary
```

## ⚙️ Kurulum

### 1. VTS Bilgilerinizi Girin

`vts_auto_runner.py` dosyasını açın ve şu satırları düzenleyin:

```python
VTS_USERNAME = "utku.kurucu"  # Sizin kullanıcı adınız
VTS_PASSWORD = "SIFRENIZ"     # Sizin şifreniz
```

**GÜVENLİK NOTU**: Şifrenizi güvenli tutun! Alternatif olarak environment variable kullanabilirsiniz:

```python
import os
VTS_PASSWORD = os.getenv('VTS_PASSWORD', '')  # Windows'ta: set VTS_PASSWORD=sifreniz
```

### 2. Chrome Tarayıcı

Google Chrome tarayıcısı bilgisayarınızda kurulu olmalıdır.
ChromeDriver otomatik indirilecektir.

## 🚀 Kullanım

### Windows:

Çift tıklayın:
```
start_vts_auto_runner.bat
```

Veya komut satırından:
```bash
python vts_auto_runner.py
```

### Manuel:

```bash
python vts_auto_runner.py
```

## 📊 İşlem Akışı

```
1. 🌐 Chrome tarayıcı açılır
   └─> https://vts.kentkart.com.tr
   
2. 🔐 Otomatik login
   └─> Kullanıcı adı ve şifre girilir
   
3. 📡 Token çekilir
   ├─> localStorage kontrol
   ├─> Cookie kontrol
   └─> Network monitoring
   
4. 🔧 Script güncellenir
   └─> vts_history_scraper_v2.py token'ı yazılır
   
5. 🚀 Script çalıştırılır
   └─> 14 hat için tüm geçişler işlenir
   
6. ✅ Sonuçlar gösterilir
   └─> Kaç satır güncellendi
   
7. 🔒 Tarayıcı kapanır
```

## 📝 İşlenen Hatlar

Script şu 14 hattı otomatik işler:

- SA65, SA64
- 400, 521C
- KC06, KF52
- KL08, KL08G
- KM61
- SD20, SD20A
- SM62
- UC32, VS18

Her hat için:
- VTS'den araç listesi çekilir
- Son 24 saatlik geçiş history'si analiz edilir
- Sarısu Depolama Merkezi-1 geçişleri tespit edilir (600m threshold)
- Database'de "Onaylanan" sütunu otomatik güncellenir

## 🔍 Sorun Giderme

### Token Bulunamadı

Manuel token alma:
1. VTS'ye giriş yapın
2. F12 (Developer Tools)
3. Application > Local Storage > `access_token`
4. Token'ı kopyalayın
5. `vts_history_scraper_v2.py`'deki token satırını güncelleyin

### Login Başarısız

VTS login sayfası değişmiş olabilir:
1. `vts_auto_runner.py` dosyasındaki CSS selector'ları güncelleyin
2. Browser'ı headless moddan çıkarın (# satırını silin)
3. Manuel login yapıp DOM'u inceleyin

### ChromeDriver Hatası

ChromeDriver otomatik indirilir ama sorun olursa:
```bash
pip install --upgrade webdriver-manager
```

## 🔒 Güvenlik

⚠️ **ÖNEMLİ**: 
- Şifrenizi kodda saklamayın
- Environment variable kullanın
- `.env` dosyası kullanabilirsiniz
- Script'i GitHub'a yüklerken `.gitignore`'a ekleyin

Örnek `.env` kullanımı:
```python
from dotenv import load_dotenv
load_dotenv()

VTS_PASSWORD = os.getenv('VTS_PASSWORD')
```

## 📈 Performans

- Ortalama süre: **2-3 dakika**
- Login: ~10 saniye
- Token çekme: ~5 saniye
- Script çalıştırma: ~2 dakika (14 hat için)

## 🛠️ Gelişmiş Ayarlar

### Headless Mode (Arka Planda Çalıştırma)

`vts_auto_runner.py` içinde:
```python
chrome_options.add_argument('--headless')  # Bu satırın # işaretini kaldırın
```

### Token Cache

Token'ı kaydetmek için:
```python
# Token'ı dosyaya yaz
with open('vts_token_cache.txt', 'w') as f:
    f.write(token)
```

Sonra tekrar kullan:
```python
# Cached token'ı oku (48 saat geçerli)
if os.path.exists('vts_token_cache.txt'):
    with open('vts_token_cache.txt', 'r') as f:
        cached_token = f.read().strip()
```

## 📞 Destek

Sorun yaşarsanız:
1. Console çıktısını kontrol edin
2. Chrome tarayıcıyı headless moddan çıkarın (gözle görün)
3. VTS login sayfası değişmiş olabilir

## 🔄 Güncelleme

GitHub'dan son sürümü çekin:
```bash
git pull origin main
```

## 📄 Lisans

Internal use only - ABB Antalya Bus Control System
