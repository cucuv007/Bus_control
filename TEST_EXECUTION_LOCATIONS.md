# Test Scriptini Nerede Çalıştıracağım?

## 🎯 3 Farklı Yoldan Test Çalıştırabilirsin

### 1. 💻 LOkal Bilgisayarında (En İyi Seçenek Başta)

Tesini local'de çalıştırmak en iyisi çünkü:
- ✅ Hızlı feedback alırsın
- ✅ Dosya yapısı sorunlarını hemen görsün
- ✅ Düzeltme yapmak kolay

**Adımlar:**

#### Windows'ta:
```bash
# PowerShell aç ve proje klasörüne git
cd "C:\Users\utkuesin.kurucu\Desktop\BusControl_Düzenli"

# Bağımlılıkları yükle (ilk çalıştırmada)
pip install -r test_requirements.txt

# Test dosyasıyla test çalıştır
python excel_parser_test.py "49_TCD49A_2025_10_14.xlsx"

# Veya debug modu çalıştır
python debug_excel.py "49_TCD49A_2025_10_14.xlsx"

# Veya tamamını otomatik çalıştır
run_test.bat "49_TCD49A_2025_10_14.xlsx"
```

#### Linux/Mac'te:
```bash
# Terminal aç ve proje klasörüne git
cd ~/Desktop/BusControl_Düzenli
# veya
cd /path/to/BusControl_Düzenli

# Bağımlılıkları yükle (ilk çalıştırmada)
pip install -r test_requirements.txt

# Test çalıştır
python3 excel_parser_test.py "49_TCD49A_2025_10_14.xlsx"

# Veya otomatik çalıştır
chmod +x run_test.sh
./run_test.sh "49_TCD49A_2025_10_14.xlsx"
```

---

### 2. 🌐 Vercel Cloud'da (Sunucuda)

GitHub'a yükledikten sonra Vercel'de test edebilirsin.

**Adımlar:**

```bash
# 1. Vercel'de terminal aç (Vercel Dashboard > Deployments > Functions)

# 2. Repository'i clone et (ilk sefere)
git clone https://github.com/cucuv007/Bus_control.git
cd Bus_control

# 3. Bağımlılıkları yükle
pip install -r test_requirements.txt

# 4. Test çalıştır (Excel dosyasını upload et, sonra çalıştır)
python excel_parser_test.py "/tmp/49_TCD49A_2025_10_14.xlsx"
```

---

### 3. 🖥️ GitHub Actions (Otomatik Test)

GitHub'a her push yaptığında otomatik test çalıştırabilirsin.

**.github/workflows/test.yml** dosyası oluştur:

```yaml
name: Excel Parser Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: pip install -r test_requirements.txt
    
    - name: Run test script
      run: python3 excel_parser_test.py "sample.xlsx" || true
```

---

## 🚀 ÖNERİLEN ÇALIŞMA AKIŞI

### 1. Local Test Et (Şimdi)

```bash
# 1. PowerShell/Terminal aç
# 2. Proje klasörüne git
cd "C:\Users\utkuesin.kurucu\Desktop\BusControl_Düzenli"

# 3. Excel dosyaları dene
python excel_parser_test.py "49_TCD49A_2025_10_14.xlsx"
python excel_parser_test.py "01_VF01_2025_11_10.xlsx"

# 4. Çıktı kontrol et:
# ✅ ✅ ✅ TEST BAŞARILI → Sorun yok!
# ❌ TEST BAŞARISIZ → Hata gider
```

### 2. Düzeltmeleri Yap

Eğer test başarısız olursa:

```bash
# Debug scripti çalıştır
python debug_excel.py "49_TCD49A_2025_10_14.xlsx"

# Çıktıda gösterilen sorunları oku
# Excel dosyasını düzelt
# Testi tekrar çalıştır
```

### 3. GitHub'a Yükle

Tüm testler başarılı olunca:

```bash
git add -A
git commit -m "Test Excel parser - all tests passed"
git push origin main
```

### 4. API'de Kullan

Process-excel.js API'sini çalıştır:

```bash
# Frontend'den "Yükle" butonuna tıkla
# API çalışacak ve verileri parse edecek
```

---

## 📊 Test Ortamları Karşılaştırması

| Özellik | Local | Vercel | GitHub Actions |
|---------|-------|--------|-----------------|
| Hız | ⚡⚡⚡ Çok hızlı | ⚡⚡ Orta | ⚡ Yavaş |
| Maliyet | 💰 Ücretsiz | 💰 Ücretsiz | 💰 Ücretsiz |
| Feedback | 📱 Anında | 📱 Hızlı | 📊 Deferred |
| Kolaylık | ✅ En kolay | ⚠️ Karışık | ⚠️ Karışık |
| **Önerilen** | **✅✅✅** | ⚠️ | ⚠️ |

---

## ✅ HEMEN ÇALIŞTIR

### Seçenek 1: Windows (PowerShell)

```powershell
# 1. Bu komutu PowerShell'e yapıştır
cd "C:\Users\utkuesin.kurucu\Desktop\BusControl_Düzenli"

# 2. Bağımlılıkları yükle (ilk sefere)
pip install openpyxl

# 3. Test çalıştır
python excel_parser_test.py "49_TCD49A_2025_10_14.xlsx"
```

### Seçenek 2: Windows (run_test.bat)

```bash
# Proje klasörünü aç
# run_test.bat çift-tıkla
# Veya Terminal'den:
run_test.bat "49_TCD49A_2025_10_14.xlsx"
```

### Seçenek 3: VS Code Terminal

```bash
# VS Code Terminal'i aç (Ctrl + `)
# Bu komutları yapıştır:
pip install openpyxl
python excel_parser_test.py "49_TCD49A_2025_10_14.xlsx"
```

---

## 🎯 TEST SONUÇLARI

### ✅ Başarılı Çıktı
```
========================================
🚀 EXCEL PARSER TEST
========================================

✅ Dosya yüklendi: 49_TCD49A_2025_10_14.xlsx
...

✅ ✅ ✅ TEST BAŞARILI - Tüm veriler parse edildi!
```

### ❌ Başarısız Çıktı
```
❌ TEST BAŞARISIZ - Veri parse edilemedi!

SORUNLAR:
  ❌ B sütununda 'Kalkış' veya 'Dönüş' satırı yok
```

**Başarısız olursa:**
1. Dosya yapısını kontrol et
2. Excel dosyasını düzelt
3. Testi tekrar çalıştır

---

## 📍 KONUMLAR

### Test Dosyaları Nerede?

```
BusControl_Düzenli/
├── excel_parser_test.py      ← Ana test
├── debug_excel.py             ← Debug modu
├── run_test.bat               ← Windows çalıştırıcı
├── run_test.sh                ← Linux çalıştırıcı
├── test_requirements.txt       ← Bağımlılıklar
├── TEST_GUIDE.md              ← Detaylı rehber
└── 49_TCD49A_2025_10_14.xlsx  ← Test dosyası (senin Excel'in)
```

### Test Çalıştırmak İçin Gereken Komut

```bash
# Windows
python excel_parser_test.py "DOSYA_ADI.xlsx"

# Linux/Mac
python3 excel_parser_test.py "DOSYA_ADI.xlsx"

# Otomatik (tüm adımlar)
run_test.bat "DOSYA_ADI.xlsx"        # Windows
./run_test.sh "DOSYA_ADI.xlsx"       # Linux/Mac
```

---

## 🔥 HEMEN BAŞLA

1. **Terminal aç** (PowerShell, CMD veya Terminal)
2. **Proje klasörüne git:**
   ```bash
   cd "C:\Users\utkuesin.kurucu\Desktop\BusControl_Düzenli"
   ```
3. **Bağımlılıkları yükle:**
   ```bash
   pip install openpyxl
   ```
4. **Test çalıştır:**
   ```bash
   python excel_parser_test.py "49_TCD49A_2025_10_14.xlsx"
   ```
5. **Sonucu oku:**
   - ✅ Başarılı → Tebrikler! Dosya doğru formatında
   - ❌ Başarısız → Excel dosyasını kontrol et

---

**Sorular?** TEST_GUIDE.md dosyasını oku veya debug_excel.py çalıştır.
