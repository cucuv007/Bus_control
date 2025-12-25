// Popup script
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const tokenPreviewEl = document.getElementById('tokenPreview');
  const timestampEl = document.getElementById('timestamp');
  const messageEl = document.getElementById('message');
  const copyBtn = document.getElementById('copyBtn');
  const openVtsBtn = document.getElementById('openVtsBtn');
  const sendToAppBtn = document.getElementById('sendToAppBtn');
  
  let currentToken = null;
  
  // Token durumunu kontrol et
  function checkToken() {
    chrome.storage.local.get(['vtsToken', 'tokenTimestamp'], (result) => {
      if (result.vtsToken) {
        currentToken = result.vtsToken;
        statusEl.textContent = '✅ Token mevcut';
        tokenPreviewEl.textContent = result.vtsToken.substring(0, 20) + '...';
        
        if (result.tokenTimestamp) {
          const date = new Date(result.tokenTimestamp);
          timestampEl.textContent = 'Alındı: ' + date.toLocaleString('tr-TR');
        }
        
        copyBtn.disabled = false;
        sendToAppBtn.disabled = false;
      } else {
        statusEl.textContent = '❌ Token yok';
        tokenPreviewEl.textContent = 'VTS\'ye giriş yapın';
        copyBtn.disabled = true;
        sendToAppBtn.disabled = true;
      }
    });
  }
  
  // Token'ı kopyala
  copyBtn.addEventListener('click', () => {
    if (currentToken) {
      navigator.clipboard.writeText(currentToken).then(() => {
        showMessage('✅ Token kopyalandı!', 'success');
      });
    }
  });
  
  // VTS'yi aç
  openVtsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://vts.kentkart.com.tr' });
  });
  
  // Ana uygulamaya gönder
  sendToAppBtn.addEventListener('click', () => {
    if (currentToken) {
      // Vercel URL'ini buraya yazın
      const appUrl = 'https://bus-control-4i5o.vercel.app/code.html?vtsToken=' + encodeURIComponent(currentToken);
      chrome.tabs.create({ url: appUrl });
      showMessage('✅ Ana uygulamaya yönlendiriliyorsunuz...', 'success');
    }
  });
  
  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'status ' + type;
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = '';
    }, 3000);
  }
  
  // İlk kontrol
  checkToken();
  
  // Her 2 saniyede kontrol et
  setInterval(checkToken, 2000);
});
