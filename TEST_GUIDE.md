# Excel Parser Test Kılavuzu

Excel dosyalarının parse edilip doğru şekilde Supabase'e yüklenebileceğini test etmek için Python test scriptleri.

## 📋 Dosyalar

- `excel_parser_test.py` - Ana test scripti (detaylı parse test)
- `debug_excel.py` - Debug scripti (yapı sorunlarını tespit et)
- `test_requirements.txt` - Python bağımlılıkları
- `run_test.sh` - Linux/Mac/WSL test çalıştırıcı
- `run_test.bat` - Windows test çalıştırıcı

## 🚀 Hızlı Başlangıç

### Windows

```bash
# Kurulum
pip install -r test_requirements.txt

# Test çalıştırma
run_test.bat "49_TCD49A_2025_10_14.xlsx"
```

### Linux / Mac / WSL

```bash
# Kurulum
chmod +x run_test.sh
./run_test.sh "49_TCD49A_2025_10_14.xlsx"

# Veya manuel çalıştırma
pip install -r test_requirements.txt
python3 debug_excel.py "49_TCD49A_2025_10_14.xlsx"
python3 excel_parser_test.py "49_TCD49A_2025_10_14.xlsx"
```

## 📖 Detaylı Kullanım

### 1. Debug Script (Yapı Sorunlarını Bulma)

```bash
python3 debug_excel.py "dosya.xlsx"
```

**Ne yapar:**
- B sütunundaki tüm değerleri listeler
- "Kalkış"/"Dönüş" satırlarını bulur
- T01, T02 gibi tarife başlıklarını arar
- Merged hücreleri gösterir
- Sorunları tanımlar ve çözüm önerir

**Çıktı örneği:**
```
✅ B sütununda 4 dolu hücre bulundu:
  ✅ Satır  1: 'Hareket'
  ⚠️ Satır  2: 'Kalkış'
  ⚠️ Satır  3: 'Dönüş'
  ...

✅ 12 Tarife başlığı bulundu:
  Satır 1: 12 başlık
    - T01 (D sütunu)
    - T02 (E sütunu)
    ...
```

### 2. Parser Test Script (Verileri Parse Etme)

```bash
python3 excel_parser_test.py "dosya.xlsx"
```

**Ne yapar:**
- Dosyayı yükler
- Sheet bilgilerini gösterir
- İlk satırları listeler
- Tarife sütunlarını bulur
- Hareket satırlarını bulur
- Verileri parse eder
- Parse edilen kayıtları gösterir

**Çıktı örneği:**
```
📋 İLK 15 SATIR (A-P sütunları)

Satır  1: | B: Hareket | D: T01 | E: T02 | F: T03
Satır  2: | B: Kalkış  | D: 06:30 | E: 07:00 | F: 07:30
Satır  3: | B: Dönüş   | D: 18:45 | E: 19:15 | F: 19:45

...

✅ 36 kayıt parse edildi

📊 ÖZET

✅ Tarife sütunları: 12 adet
   - T01 (D sütunu, satır 1)
   - T02 (E sütunu, satır 1)
   ...

✅ Hareket satırları: 2 adet
   - Satır 2: Kalkış
   - Satır 3: Dönüş

✅ Parse edilen kayıtlar: 36 adet

   İlk 5 kayıt:
   1. T01 | Kalkış | 06:30:00
   2. T02 | Kalkış | 07:00:00
   3. T03 | Kalkış | 07:30:00
   4. T01 | Dönüş | 18:45:00
   5. T02 | Dönüş | 19:15:00

✅ ✅ ✅ TEST BAŞARILI - Tüm veriler parse edildi!
```

## ✅ Başarılı Test Kriterleri

Test başarılı olması için:

```
✅ 0 dosya hata OLMAMASI gerekir
```

Yani API çıktısında bu görünmemelidir:
```
❌ 1 dosya hata:
• 49_TCD49A_2025_10_14.xlsx: B sütununda "Kalkış" veya "Dönüş" ...
```

## ❌ Sorun Giderme

### Problem 1: "Tarife sütunu bulunamadı"

**Çözüm:**
```bash
# Adım 1: Debug script'i çalıştır
python3 debug_excel.py "dosya.xlsx"

# Adım 2: Çıktıda "❌ PROBLEM: T01, T02, T03..." uyarısını ara

# Adım 3: Excel dosyasını açıp kontrol et:
# - D sütunundan başlayan hücreler T01, T02, T03 içeriyor mu?
# - Başlıklar doğru satırda mı (genelde satır 1)?
```

### Problem 2: "Hareket satırı bulunamadı"

**Çözüm:**
```bash
# Adım 1: Debug script'i çalıştır
python3 debug_excel.py "dosya.xlsx"

# Adım 2: B sütunundaki değerleri ara

# Adım 3: Excel dosyasını kontrol et:
# - B sütununda "Kalkış" veya "Dönüş" yazıyor mu?
# - Yazım tam olarak aynı mı? (Türkçe karakterler önemli)
# - Başında/sonunda boşluk var mı?
```

### Problem 3: "Veri parse edilemedi"

**Çözüm:**
```bash
# Adım 1: Parser test'i çalıştır ve çıktıyı ara

# Adım 2: Saat formatını kontrol et:
# ✅ Doğru formatlar: 06:30, 06:30:00
# ❌ Yanlış formatlar: 6:30, 6.30, 06.30

# Adım 3: Tarife x Hareket kesişim hücrelerinde saat var mı?
```

## 📊 Expected Excel Yapısı

```
┌───┬─────────┬─────┬────────┬────────┬────────┬─────┐
│ A │ B       │ C   │ D      │ E      │ F      │ ... │
├───┼─────────┼─────┼────────┼────────┼────────┼─────┤
│ 1 │ Hareket │ ---│ T01    │ T02    │ T03    │ ... │ (Başlık)
├───┼─────────┼─────┼────────┼────────┼────────┼─────┤
│ 2 │ Kalkış  │ --- │ 06:30  │ 07:00  │ 07:30  │ ... │ (Veriler)
├───┼─────────┼─────┼────────┼────────┼────────┼─────┤
│ 3 │ Dönüş   │ --- │ 18:45  │ 19:15  │ 19:45  │ ... │ (Veriler)
└───┴─────────┴─────┴────────┴────────┴────────┴─────┘
```

**Gerekli unsurlar:**
- ✅ B sütununda "Kalkış" ve/veya "Dönüş"
- ✅ D sütunundan başlayarak T01, T02, T03...
- ✅ Kesişim hücrelerinde saat: 06:30 veya 06:30:00
- ✅ Dosya adı: XX_TABLENAME_YYYY_MM_DD.xlsx
  - Örnek: 49_TCD49A_2025_10_14.xlsx
  - Kural: `filename.split('_')[1]` → TCD49A

## 🔄 Test Akışı

```
1. run_test.bat/run_test.sh çalıştır
   ↓
2. Bağımlılıkları otomatik yükle (ilk çalıştırmada)
   ↓
3. debug_excel.py çalıştır (yapı sorunlarını bul)
   ↓
4. excel_parser_test.py çalıştır (verileri parse et)
   ↓
5. Çıktı kontrol et:
   - ✅ ✅ ✅ TEST BAŞARILI → GitHub'a yükle
   - ❌ TEST BAŞARISIZ → Sorun Giderme bölümüne git
```

## 📥 GitHub'a Yükleme

```bash
# Test dosyalarını staging'e ekle
git add excel_parser_test.py debug_excel.py
git add test_requirements.txt run_test.sh run_test.bat
git add TEST_GUIDE.md

# Commit yap
git commit -m "Add Excel parser test scripts

- excel_parser_test.py: Ana test scripti
- debug_excel.py: Debug ve yapı kontrolü
- run_test.sh: Linux/Mac/WSL için test çalıştırıcı
- run_test.bat: Windows için test çalıştırıcı
- test_requirements.txt: Python bağımlılıkları"

# Push yap
git push origin main
```

## 🔧 Sunucuda Çalıştırma

```bash
# Repository'i clone et
git clone https://github.com/cucuv007/Bus_control.git
cd Bus_control

# Bağımlılıkları yükle
pip install -r test_requirements.txt

# Test çalıştır
python3 excel_parser_test.py "/path/to/excel/file.xlsx"
```

## 📝 Notlar

- Python 3.6+ gerekli
- openpyxl 3.9.0+ gerekli
- Windows'ta `run_test.bat` komutu çalıştırmadan önce `pip install -r test_requirements.txt` çalıştırabilirsiniz
- Test scriptleri okuma amaçlıdır - Excel dosyalarını değiştirmez

## 🎯 Başarı Kriteri

Test başarılı olması için çıktı şöyle görünmelidir:

```
✅ ✅ ✅ TEST BAŞARILI - Tüm veriler parse edildi!
```

Ve bu çıktıdan sonra API'ye Excel dosyasını yükleyebilirsiniz.

---

**Son Güncelleme:** 2025-11-12
**Versiyon:** 1.0
**Durum:** Hazır
