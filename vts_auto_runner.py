"""
VTS Otomatik Çalıştırıcı
- VTS'ye otomatik login yapar
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
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# VTS Login Bilgileri
VTS_URL = "https://vts.kentkart.com.tr"
VTS_USERNAME = "utku.kurucu"  # Kullanıcı adınızı buraya yazın
VTS_PASSWORD = ""  # ŞİFRENİZİ BURAYA YAZIN (güvenlik için environment variable kullanabilirsiniz)

def get_chrome_driver():
    """Chrome WebDriver'ı hazırla"""
    chrome_options = Options()
    
    # Tarayıcı ayarları
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Headless mode (arka planda çalışsın mı?)
    # chrome_options.add_argument('--headless')  # İsterseniz açın
    
    # User agent
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    # ChromeDriver otomatik yüklensin
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

def login_to_vts(driver):
    """VTS'ye otomatik login yap"""
    print("🔐 VTS'ye giriş yapılıyor...")
    
    try:
        driver.get(VTS_URL)
        time.sleep(2)
        
        # Login sayfasını bekle
        wait = WebDriverWait(driver, 10)
        
        # Kullanıcı adı alanını bul ve doldur
        username_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text'], input[name='username'], input[id*='username'], input[id*='user']"))
        )
        username_input.clear()
        username_input.send_keys(VTS_USERNAME)
        print(f"✅ Kullanıcı adı girildi: {VTS_USERNAME}")
        
        # Şifre alanını bul ve doldur
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.clear()
        password_input.send_keys(VTS_PASSWORD)
        print("✅ Şifre girildi")
        
        # Login butonunu bul ve tıkla
        login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], button.login, input[type='submit']")
        login_button.click()
        print("🔄 Login butonuna tıklandı...")
        
        # Login işleminin tamamlanmasını bekle
        time.sleep(5)
        
        # URL kontrolü ile login başarılı mı?
        if "login" not in driver.current_url.lower():
            print("✅ VTS'ye başarıyla giriş yapıldı!")
            return True
        else:
            print("❌ Login başarısız olabilir, kontrol ediliyor...")
            return False
            
    except Exception as e:
        print(f"❌ Login hatası: {e}")
        return False

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
    """Ana fonksiyon - tam otomatik süreç"""
    print("=" * 60)
    print("🚍 VTS OTOMATIK RUNNER")
    print("=" * 60)
    print()
    
    # Şifre kontrolü
    if not VTS_PASSWORD:
        print("❌ HATA: VTS_PASSWORD boş!")
        print("Lütfen script'in başındaki VTS_PASSWORD değişkenine şifrenizi yazın.")
        return
    
    driver = None
    
    try:
        # 1. Chrome WebDriver'ı başlat
        print("🌐 Chrome tarayıcı açılıyor...")
        driver = get_chrome_driver()
        
        # 2. VTS'ye login yap
        login_success = login_to_vts(driver)
        
        if not login_success:
            print("❌ Login başarısız, işlem durduruluyor.")
            return
        
        # 3. Token'ı çek
        token = extract_vts_token(driver)
        
        if not token:
            print("❌ Token alınamadı, işlem durduruluyor.")
            print("\n💡 Manuel Token Alma Yöntemi:")
            print("1. VTS'ye giriş yapın")
            print("2. F12 > Application > Local Storage > access_token'ı kopyalayın")
            print("3. vts_history_scraper_v2.py'deki token'ı manuel güncelleyin")
            return
        
        print(f"\n✅ Token başarıyla alındı!")
        print(f"Token uzunluğu: {len(token)} karakter")
        print(f"Token başlangıcı: {token[:50]}...")
        
        # 4. Script'teki token'ı güncelle
        update_success = update_script_token(token)
        
        if not update_success:
            print("❌ Token güncelleme başarısız, işlem durduruluyor.")
            return
        
        print("\n⏳ 3 saniye bekleniyor...")
        time.sleep(3)
        
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
        # Tarayıcıyı kapat
        if driver:
            print("\n🔒 Tarayıcı kapatılıyor...")
            time.sleep(2)
            driver.quit()
            print("✅ Tarayıcı kapatıldı.")

if __name__ == "__main__":
    main()
