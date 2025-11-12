# Excel Parser Test Suite - GitHub Yükleme Hazırlığı

## 📦 Yüklenen Dosyalar

Aşağıdaki dosyalar GitHub'a yüklenmeye hazır:

### Python Test Scriptleri
- ✅ `excel_parser_test.py` - Ana test scripti (detaylı parsing testi)
- ✅ `debug_excel.py` - Yapı sorunlarını tespit etme
- ✅ `test_requirements.txt` - Python bağımlılıkları (openpyxl)

### Test Çalıştırıcıları
- ✅ `run_test.sh` - Linux/Mac/WSL için bash scripti
- ✅ `run_test.bat` - Windows için batch scripti

### Dokümantasyon
- ✅ `TEST_GUIDE.md` - Kapsamlı test kılavuzu
- ✅ `EXCEL_PARSER_TEST_README.md` - Ek açıklamalar

## 🎯 Test Amacı

Excel dosyalarının aşağıdaki kriterleri karşılayıp karşılamadığını kontrol et:

1. **B sütununda Hareket değerleri**
   - "Kalkış" veya "Dönüş" yazısı olmalı
   - Türkçe karakterler doğru olmalı

2. **D+ sütunlarında Tarife başlıkları**
   - T01, T02, T03... formatında başlıklar
   - Her başlığın altında saat değeri

3. **Saat Formatı**
   - HH:MM (06:30) veya
   - HH:MM:SS (06:30:00) formatında

4. **Dosya Adı**
   - XX_TABLENAME_YYYY_MM_DD.xlsx formatında
   - Örnek: 49_TCD49A_2025_10_14.xlsx

## ✅ Başarı Göstergesi

Test başarılı olduğunda:

```
✅ ✅ ✅ TEST BAŞARILI - Tüm veriler parse edildi!
```

Bu mesaj göründüğünde, Excel dosyası API'ye yüklenebilir.

## 🚀 Kullanım Talimatları

### Windows
```bash
# Bağımlılıkları yükle (ilk çalıştırmada)
pip install -r test_requirements.txt

# Test çalıştır
run_test.bat "dosya.xlsx"
```

### Linux / Mac / WSL
```bash
# İcra yetkisi ver
chmod +x run_test.sh

# Test çalıştır
./run_test.sh "dosya.xlsx"
```

## 📋 Git Komutu

```bash
# Tüm test dosyalarını staging'e ekle
git add excel_parser_test.py debug_excel.py
git add test_requirements.txt run_test.sh run_test.bat
git add TEST_GUIDE.md EXCEL_PARSER_TEST_README.md

# Commit yap
git commit -m "Add Excel parser test suite

- Python test scripts for Excel file validation
- Automated test runners for Windows and Linux
- Comprehensive testing documentation
- Supports Excel parsing before API upload"

# Push yap
git push origin main
```

## 📊 Test Çıktısı Örneği

### Başarılı Test
```
========================================
🚀 EXCEL PARSER TEST
========================================

✅ Dosya yüklendi: 49_TCD49A_2025_10_14.xlsx
📋 Sheet adı: Sheet1
📊 Aralık: A1:P10
📊 Satırlar: 0 to 9 (Toplam: 10)
📊 Sütunlar: 0 to 15 (Toplam: 16)

...

✅ 12 Tarife sütunu bulundu
✅ 2 Hareket satırı bulundu
✅ 24 kayıt parse edildi

📊 ÖZET

✅ Tarife sütunları: 12 adet
✅ Hareket satırları: 2 adet
✅ Parse edilen kayıtlar: 24 adet

✅ ✅ ✅ TEST BAŞARILI - Tüm veriler parse edildi!
```

### Başarısız Test
```
❌ TEST BAŞARISIZ - Veri parse edilemedi!

SORUNLAR:
  ❌ B sütununda 'Kalkış' veya 'Dönüş' satırı yok
  ❌ T01, T02... tarife başlıkları yok
```

## 🔄 Iş Akışı

```
1. Excel dosyası hazırlat
   ↓
2. Test scriptini çalıştır
   ├─ debug_excel.py (yapı sorunlarını bul)
   └─ excel_parser_test.py (verileri parse et)
   ↓
3. Test başarılı mı?
   ├─ EVET → API'ye yükle
   └─ HAYIR → Excel dosyasını düzelt, testi tekrar çalıştır
   ↓
4. GitHub'a kaydetme
```

## 🛠️ Teknik Bilgiler

### Python Versiyonu
- Minimum: 3.6
- Önerilen: 3.9+

### Bağımlılıklar
- openpyxl 3.9.0+ (Excel dosyasını okumak için)

### İşletim Sistemleri
- ✅ Windows (run_test.bat)
- ✅ Linux (run_test.sh)
- ✅ macOS (run_test.sh)
- ✅ WSL (run_test.sh)

## 📝 Notlar

1. Test scriptleri **okuma amaçlıdır** - Excel dosyalarını değiştirmez
2. İlk çalıştırmada bağımlılıklar otomatik yüklenir
3. Her test çalıştırması bağımsızdır - önceki sonuçları etkilemez
4. Debug scripti (`debug_excel.py`) sorun giderme için kullanılır

## ✨ Sonraki Adımlar

Test dosyaları GitHub'a yüklendikten sonra:

1. ✅ API'deki process-excel.js güncellenecek (debug çıktıları kapatılacak)
2. ✅ Frontend yükleme fonksiyonu iyileştirilecek
3. ✅ Hata yönetimi geliştirilecek
4. ✅ Supabase tablo oluşturma otomatikleştirilecek

---

**Hazırlık Tarihi:** 2025-11-12
**Durum:** ✅ Hazır
**Sonraki Adım:** GitHub'a yükle ve API testini çalıştır
