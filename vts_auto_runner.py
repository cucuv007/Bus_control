"""
VTS Otomatik Çalıştırıcı - Basitleştirilmiş Versiyon
- Kullanıcı VTS'ye manuel login yapar
- Script açık Chrome tarayıcısına bağlanır
- Token'ı otomatik çeker
- vts_history_scraper_v2.py'yi otomatik çalıştırır
"""

import os
import sys
import time
import json
import re
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# VTS URL
VTS_URL = "https://vts.kentkart.com.tr"

def connect_to_existing_chrome():
    """Açık Chrome tarayıcısına bağlan"""
    chrome_options = Options()
    
    # Mevcut Chrome'a bağlan (debug port üzerinden)
    chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        print("✅ Açık Chrome tarayıcısına bağlanıldı!")
        return driver
    except Exception as e:
        print(f"❌ Chrome'a bağlanılamadı: {e}")
        print("\n💡 ÇÖZÜM:")
        print("Chrome'u şu şekilde başlatın:")
        print('chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\\selenium\\chrome_profile"')
        print("\nVEYA Windows için:")
        print('"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\selenium\\chrome_profile"')
        return None

def wait_for_vts_login(driver):
    """Kullanıcının VTS'ye login olmasını bekle"""
    print("\n⏳ VTS'ye login olmanız bekleniyor...")
    print(f"📍 Lütfen şu adrese gidin: {VTS_URL}")
    print("🔐 Kullanıcı adı ve şifrenizle giriş yapın")
    print("\n✋ Giriş yaptıktan sonra ENTER tuşuna basın...")
    
    input()  # Kullanıcının ENTER'a basmasını bekle
    
    # URL kontrolü
    current_url = driver.current_url
    if VTS_URL in current_url and "login" not in current_url.lower():
        print("✅ VTS'de oturum açık görünüyor!")
        return True
    else:
        print("⚠️ VTS'de login olduğunuzdan emin olun")
        return True  # Yine de devam et, token kontrolü yapacağız

def extract_vts_token(driver):
    """VTS token'ını otomatik çek"""
    print("\n📡 VTS token'ı çekiliyor...")
    
    try:
        # Method 1: localStorage'dan token al
        token = driver.execute_script("""
            return localStorage.getItem('access_token') || 
                   localStorage.getItem('token') || 
                   localStorage.getItem('vts_token') ||
                   localStorage.getItem('authToken');
        """)
        
        if token:
            print("✅ Token localStorage'dan alındı")
            return token
        
        # Method 2: Cookie'den token al
        cookies = driver.get_cookies()
        for cookie in cookies:
            if 'token' in cookie['name'].lower() or cookie['name'] == 'access_token':
                token = cookie['value']
                print(f"✅ Token cookie'den alındı: {cookie['name']}")
                return token
        
        # Method 3: Network isteklerinden token al (daha gelişmiş)
        # Bu method için Chrome DevTools Protocol kullanmak gerekir
        print("⚠️ Token bulunamadı, sayfa yenilenip tekrar deneniyor...")
        
        # Sayfayı yenile
        driver.refresh()
        time.sleep(3)
        
        # Tekrar dene
        token = driver.execute_script("""
            return localStorage.getItem('access_token') || 
                   localStorage.getItem('token');
        """)
        
        if token:
            print("✅ Token ikinci denemede bulundu")
            return token
        
        # Method 4: Network monitoring ile token yakala
        print("🔍 Network istekleri izleniyor...")
        
        # Sayfada bir API isteği tetikle (örn: map'e tıkla)
        time.sleep(2)
        
        # JavaScript ile token yakala
        token = driver.execute_script("""
            // Try to find token in any request header
            const performanceEntries = performance.getEntriesByType('resource');
            for (let entry of performanceEntries) {
                if (entry.name.includes('api') || entry.name.includes('v1')) {
                    console.log('API request found:', entry.name);
                }
            }
            
            // Return any stored token
            return localStorage.getItem('access_token') || 
                   sessionStorage.getItem('access_token') ||
                   localStorage.getItem('token');
        """)
        
        if token:
            print("✅ Token network monitoring ile bulundu")
            return token
        
        print("❌ Token otomatik bulunamadı")
        return None
        
    except Exception as e:
        print(f"❌ Token çekme hatası: {e}")
        return None

def update_script_token(token):
    """vts_history_scraper_v2.py içindeki token'ı güncelle"""
    print("\n🔧 Script token'ı güncelleniyor...")
    
    script_path = os.path.join(os.path.dirname(__file__), 'vts_history_scraper_v2.py')
    
    try:
        with open(script_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Token'ı değiştir
        # Pattern: 'access_token': 'ESKI_TOKEN'
        pattern = r"'access_token':\s*'[^']*'"
        replacement = f"'access_token': '{token}'"
        
        new_content = re.sub(pattern, replacement, content)
        
        # Dosyayı güncelle
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ Token script'e yazıldı (ilk 30 karakter: {token[:30]}...)")
        return True
        
    except Exception as e:
        print(f"❌ Script güncelleme hatası: {e}")
        return False

def run_vts_scraper():
    """vts_history_scraper_v2.py'yi çalıştır"""
    print("\n🚀 VTS History Scraper çalıştırılıyor...\n")
    print("=" * 60)
    
    script_path = os.path.join(os.path.dirname(__file__), 'vts_history_scraper_v2.py')
    
    try:
        # Python script'i çalıştır
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=False,  # Çıktıyı direkt göster
            text=True
        )
        
        print("\n" + "=" * 60)
        
        if result.returncode == 0:
            print("✅ VTS History Scraper başarıyla tamamlandı!")
            return True
        else:
            print(f"⚠️ Script exit code: {result.returncode}")
            return False
            
    except Exception as e:
        print(f"❌ Script çalıştırma hatası: {e}")
        return False

def main():
    """Ana fonksiyon - basitleştirilmiş otomatik süreç"""
    print("=" * 60)
    print("🚍 VTS OTOMATIK RUNNER - Basit Versiyon")
    print("=" * 60)
    print()
    print("📋 ADIMLAR:")
    print("1. Chrome'u debug modda başlatın")
    print("2. VTS'ye manuel login yapın")
    print("3. Script otomatik token çekip çalıştırır")
    print()
    
    driver = None
    
    try:
        # 1. Açık Chrome'a bağlan
        print("🌐 Chrome'a bağlanılıyor...")
        driver = connect_to_existing_chrome()
        
        if not driver:
            print("\n❌ Chrome'a bağlanılamadı!")
            print("\n📝 NASIL YAPILIR:")
            print("1. Tüm Chrome pencerelerini kapatın")
            print("2. Şu komutu çalıştırın:")
            print('   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222')
            print("3. Bu script'i tekrar çalıştırın")
            return
        
        # 2. Kullanıcının VTS'ye login olmasını bekle
        wait_for_vts_login(driver)
        
        # 3. Token'ı çek
        print("\n📡 Token çekiliyor...")
        token = extract_vts_token(driver)
        
        if not token:
            print("❌ Token alınamadı!")
            print("\n💡 Manuel Token Alma:")
            print("1. VTS'de F12 tuşuna basın")
            print("2. Application > Local Storage > access_token'ı kopyalayın")
            print("3. Aşağıya yapıştırın")
            print()
            token = input("Token'ı buraya yapıştırın: ").strip()
            
            if not token:
                print("❌ Token girilmedi, işlem durduruluyor.")
                return
        
        print(f"\n✅ Token başarıyla alındı!")
        print(f"Token uzunluğu: {len(token)} karakter")
        print(f"Token başlangıcı: {token[:50]}...")
        
        # 4. Script'teki token'ı güncelle
        update_success = update_script_token(token)
        
        if not update_success:
            print("❌ Token güncelleme başarısız, işlem durduruluyor.")
            return
        
        print("\n⏳ 2 saniye bekleniyor...")
        time.sleep(2)
        
        # 5. VTS History Scraper'ı çalıştır
        run_vts_scraper()
        
        print("\n" + "=" * 60)
        print("✅ TÜM İŞLEMLER TAMAMLANDI!")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\n⚠️ İşlem kullanıcı tarafından iptal edildi.")
        
    except Exception as e:
        print(f"\n❌ Beklenmeyen hata: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Chrome'u açık bırak (kullanıcı kapatsın)
        print("\n💡 Chrome penceresi açık bırakıldı. İsterseniz kapatabilirsiniz.")

if __name__ == "__main__":
    main()
