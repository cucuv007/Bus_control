// VTS sayfasında çalışan content script
// localStorage'dan token'ı otomatik alır

console.log('🚀 VTS Token Extractor aktif!');

// Token'ı kontrol et ve gönder
function checkAndSendToken() {
  const token = localStorage.getItem('access_token') || 
                localStorage.getItem('token') ||
                localStorage.getItem('vts_token') ||
                sessionStorage.getItem('access_token');
  
  if (token) {
    console.log('✅ Token bulundu!');
    
    // Token'ı storage'a kaydet
    chrome.storage.local.set({ vtsToken: token }, () => {
      console.log('Token extension storage\'a kaydedildi');
    });
    
    // Background script'e bildir
    chrome.runtime.sendMessage({
      type: 'TOKEN_FOUND',
      token: token
    });
    
    return true;
  }
  
  return false;
}

// Sayfa yüklendiğinde token kontrolü
if (document.readyState === 'complete') {
  setTimeout(checkAndSendToken, 2000);
} else {
  window.addEventListener('load', () => {
    setTimeout(checkAndSendToken, 2000);
  });
}

// localStorage değişikliklerini izle
window.addEventListener('storage', (e) => {
  if (e.key === 'access_token' || e.key === 'token' || e.key === 'vts_token') {
    console.log('Token güncellendi!');
    checkAndSendToken();
  }
});

// Periyodik kontrol (her 5 saniyede)
setInterval(checkAndSendToken, 5000);

console.log('VTS Token Extractor hazır - Giriş yaptıktan sonra token otomatik alınacak!');
