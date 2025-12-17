# 🚍 VTS Otomatik Runner - Basit Versiyon

Kullanıcı manuel VTS'ye login olur, script otomatik token çekip `vts_history_scraper_v2.py`'yi çalıştırır.

## 🎯 Özellikler

✅ **Kolay Kurulum**: Şifre gerekmez, manuel login
✅ **Güvenli**: Credentials kod içinde tutulmaz
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

### 1. Gereksinimler

```bash
pip install -r vts_auto_requirements.txt
```

Veya manuel:
```bash
pip install selenium webdriver-manager
```

### 2. Chrome Tarayıcı

Google Chrome tarayıcısı bilgisayarınızda kurulu olmalıdır.
ChromeDriver otomatik indirilecektir.

**ÖNEMLİ**: Şifre veya kullanıcı adı gerekmez! Manuel login yapacaksınız.

## 🚀 Kullanım

### Yöntem 1: Otomatik (Önerilen)

Çift tıklayın:
```
start_vts_auto_runner.bat
```

**Ne olacak:**
1. ✅ Chrome debug modda açılır
2. ✅ VTS login sayfası açılır
3. ⏸️ SİZ LOGIN YAPIN (kullanıcı adı + şifre)
4. ⏸️ Bu pencereye dönün ve ENTER'a basın
5. ✅ Token otomatik çekilir
6. ✅ Script otomatik çalışır
7. ✅ 14 hat işlenir

### Yöntem 2: Manuel

```bash
# 1. Chrome'u debug modda başlatın
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222

# 2. VTS'ye gidin ve login olun
# https://vts.kentkart.com.tr

# 3. Script'i çalıştırın
python vts_auto_runner.py
```

## 📊 İşlem Akışı

```
[BAT DOSYASI ÇALIŞTIR]
   ↓
1. 🌐 Chrome debug modda açılır
   └─> https://vts.kentkart.com.tr
   
2. 👤 SİZ LOGIN YAPIN
   ├─> Kullanıcı adı girin
   ├─> Şifre girin
   └─> Login butonuna tıklayın
   
3. ⏸️ ENTER tuşuna basın (bat dosyasında)
   
4. 🔗 Script Chrome'a bağlanır
   └─> Debug port: 9222
   
5. 📡 Token otomatik çekilir
   ├─> localStorage kontrol
   ├─> Cookie kontrol
   └─> Manuel input (gerekirse)
   
6. 🔧 Script güncellenir
   └─> vts_history_scraper_v2.py token'ı yazılır
   
7. 🚀 Script otomatik çalıştırılır
   └─> 14 hat için tüm geçişler işlenir
   
8. ✅ Sonuçlar gösterilir
   └─> Kaç satır güncellendi
   
9. 💡 Chrome açık kalır (isterseniz kapatın)
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

✅ **GÜVENLİ**: 
- Şifre kodda tutulmaz
- Manuel login yaparsınız
- Token sadece geçici çekilir
- Credentials GitHub'a yüklenmez

**Avantajlar:**
- Şifre unutma riski yok
- Şifre değişirse kod güncelleme gerekmez
- Multi-factor authentication (MFA) destekler
- Daha güvenli ve esnek

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
