# Excel Parser Test

Python test scripti Excel dosyalarını parse etmek ve hataları bulmak için kullanılır.

## Kurulum

### Gerekli Paketler

```bash
pip install openpyxl
```

## Kullanım

```bash
python excel_parser_test.py "<Excel dosyası yolu>"
```

### Örnekler

```bash
# Mevcut dizindeki dosya
python excel_parser_test.py "49_TCD49A_2025_10_14.xlsx"

# Tam yol
python excel_parser_test.py "/home/user/files/01_VF01_2025_11_10.xlsx"

# Windows
python excel_parser_test.py "C:\Users\user\Desktop\file.xlsx"
```

## Test Script Neler Yapar?

1. **Dosya Yükleme**: Excel dosyasını openpyxl ile açar
2. **Sheet Bilgisi**: Toplam satır/sütun sayısını gösterir
3. **İlk Satırları Göster**: İlk 15 satırın A-P sütunlarını ekrana basar
4. **Merged Hücreleri Göster**: Birleştirilmiş hücreleri listeler
5. **Tarife Sütunlarını Bul**: T01, T02, T03... başlıklarını arar
6. **Hareket Satırlarını Bul**: B sütununda "Kalkış"/"Dönüş" satırlarını arar
7. **Verileri Parse Et**: Bulunan verileri şu formata dönüştürür:
   ```
   {
     "tarife": "T01",
     "hareket": "Kalkış",
     "tarife_saati": "06:30:00",
     "onaylanan": null,
     "durum": null,
     "plaka": null
   }
   ```
8. **Özet Yazdır**: Başarılı parse edilen kayıt sayısını gösterir

## Çıktı Örnekleri

### Başarılı Test
```
✅ ✅ ✅ TEST BAŞARILI - Tüm veriler parse edildi!
```

### Başarısız Test
```
❌ TEST BAŞARISIZ - Veri parse edilemedi!
```

## Hata Çıktıları

- ❌ Dosya bulunamadı
- ❌ Tarife sütunu bulunamadı
- ❌ Hareket satırı bulunamadı
- ❌ Veri parse edilemedi

## Dosya Yapısı Beklentileri

Excel dosyası şu şekilde yapılandırılmış olmalıdır:

```
| A  | B          | C  | D    | E    | ... | (Tarife Sütunları)
|----|------------|----|----- |----- |-----|----
| 1  | (header)   | -- | T01  | T02  | ... | (Tarife başlıkları)
| 2  | Kalkış     | -- | 06:30| 07:00| ... | (Saat verileri)
| 3  | Dönüş      | -- | 18:45| 19:15| ... | (Saat verileri)
| 4  | ...        | -- | ...  | ...  | ... |
```

**Gerekli Kriterler:**
- B sütununda en az bir "Kalkış" veya "Dönüş" satırı
- D sütunundan başlayan en az bir T{sayı} başlıklı sütun
- Saat değerleri HH:MM veya HH:MM:SS formatında

## GitHub'a Yükleme

```bash
git add excel_parser_test.py
git add EXCEL_PARSER_TEST_README.md
git commit -m "Add Excel parser test script"
git push origin main
```

## Sunucuda Çalıştırma

```bash
# Repository'i clone et
git clone https://github.com/cucuv007/Bus_control.git
cd Bus_control

# Python bağımlılıklarını kur
pip install openpyxl

# Test dosyasını çalıştır
python excel_parser_test.py "/path/to/excel/file.xlsx"
```

## Sorun Çözme

### "Tarife sütunu bulunamadı"
- Excel dosyasında T01, T02, T03 gibi başlıklar var mı?
- Başlıklar hangi satırda? (Script ilk 20 satırda arar)
- Başlıklar doğru isimlendirilmiş mi? (T + sayı formatında olmalı)

### "Hareket satırı bulunamadı"
- B sütununda "Kalkış" veya "Dönüş" yazıyor mu?
- Yazım doğru mu? (Türkçe karakterler ve boşluklar önemli)
- Satırlar hangi satırda? (Script tüm satırları arar)

### "Veri parse edilemedi"
- Saat değerleri hangi formatta?
  - ✅ HH:MM (06:30)
  - ✅ HH:MM:SS (06:30:00)
  - ✅ Excel decimal format
  - ❌ Diğer formatlar

### Hata Mesajları
Script çalıştığında hata mesajlarını dikkatlice oku. Her hata, sorunun neresinin olduğunu gösterir.

---

**Son Güncelleme:** 2025-11-12
