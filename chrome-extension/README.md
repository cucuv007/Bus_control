# VTS Token Auto Extractor - Chrome Extension

## Otomatik Token Alma Uzantısı

Bu Chrome Extension, VTS'den token'ı **TAMAMEN OTOMATİK** alır!

### Özellikler

✅ **Otomatik token algılama** - VTS'ye giriş yaptığınızda otomatik alır
✅ **Arka planda çalışır** - Hiçbir şey yapmanıza gerek yok
✅ **Güvenli** - Token sadece sizin tarayıcınızda saklanır
✅ **Tek tıkla gönderme** - Token'ı direkt ana uygulamaya gönderir

### Kurulum

1. **Chrome Extensions sayfasını açın:**
   - Chrome'da `chrome://extensions/` adresine gidin
   - Sağ üstteki **Developer mode**'u açın

2. **Extension'ı yükleyin:**
   - **Load unpacked** butonuna tıklayın
   - `chrome-extension` klasörünü seçin

3. **Tamam!** Extension yüklendi

### Kullanım

1. VTS'ye giriş yapın: `https://vts.kentkart.com.tr`
2. Extension **otomatik olarak** token'ı alacak
3. Extension ikonuna tıklayın (sağ üst köşe)
4. **"🚍 Ana Uygulamaya Gönder"** butonuna tıklayın
5. **DONE!** Token ile ana sayfaya yönlendirileceksiniz

### Icon Anlamları

- **?** (Mavi) - Token aranıyor
- **✓** (Yeşil) - Token bulundu!

### Geliştirici Notları

Extension şunları yapar:
- VTS sayfasında `content.js` çalışır
- `localStorage.access_token` değerini okur
- Chrome extension storage'a kaydeder
- Her 5 saniyede kontrol eder
- Token bulunduğunda badge yeşil olur

### Güvenlik

- Token sadece LOCAL'de saklanır
- Hiçbir sunucuya gönderilmez
- Sadece sizin seçtiğiniz domain'lere erişir
- Open source - kodu inceleyebilirsiniz

### Sorun Giderme

**Token bulunamıyor:**
- VTS'ye giriş yaptığınızdan emin olun
- Extension'ın aktif olduğunu kontrol edin
- Sayfayı yenileyin (F5)

**Extension çalışmıyor:**
- Developer mode açık mı?
- Extension yüklü mü? (chrome://extensions)
- Console'da hata var mı? (F12)

### Destek

Sorun yaşarsanız:
1. Chrome console'u açın (F12)
2. Console tab'ında hata mesajlarını kontrol edin
3. Extension'ı yeniden yükleyin (Reload button)
