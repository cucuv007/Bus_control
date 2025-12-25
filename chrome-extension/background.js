// Background service worker
// Token mesajlarını dinler ve yönetir

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOKEN_FOUND') {
    console.log('✅ Token alındı:', message.token.substring(0, 30) + '...');
    
    // Token'ı storage'a kaydet
    chrome.storage.local.set({ 
      vtsToken: message.token,
      tokenTimestamp: Date.now()
    });
    
    // Badge göster
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#27ae60' });
    
    sendResponse({ success: true });
  }
  
  if (message.type === 'GET_TOKEN') {
    // Token isteme
    chrome.storage.local.get(['vtsToken', 'tokenTimestamp'], (result) => {
      if (result.vtsToken) {
        sendResponse({ 
          success: true, 
          token: result.vtsToken,
          timestamp: result.tokenTimestamp
        });
      } else {
        sendResponse({ 
          success: false, 
          error: 'Token bulunamadı' 
        });
      }
    });
    return true; // Async response için
  }
});

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
  console.log('VTS Token Extractor yüklendi!');
  chrome.action.setBadgeText({ text: '?' });
  chrome.action.setBadgeBackgroundColor({ color: '#3498db' });
});
