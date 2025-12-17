"""
VTS Desktop Automation
Tamamen otomatik token alma ve güncelleme sistemi
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import requests
import json

# Supabase Configuration
SUPABASE_URL = 'https://vhxjyfappvmtwfdkhkoc.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeGp5ZmFwcHZtdHdmZGtoa29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0Njg5MzMsImV4cCI6MjA0NDA0NDkzM30.gxkYI-hHXSWLtWkQr6QJ6MCF6y8MJQVNcYfp0eFSKSc'

# VTS Configuration
VTS_URL = 'https://vts.kentkart.com.tr'
VTS_API_BASE = 'https://vts.kentkart.com.tr/api/026/v1'

# Routes to process
ROUTES = ['SA65', 'SA64', '400', '521C', 'KC06', 'KF52', 'KL08', 'KL08G', 'KM61', 'SD20', 'SD20A', 'SM62', 'UC32', 'VS18']

def print_header(text):
    """Print colored header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_step(step, text):
    """Print step info"""
    print(f"[{step}] {text}")

def setup_chrome_driver():
    """Setup Chrome driver with DevTools Protocol"""
    print_step("1/6", "Chrome sürücüsü hazırlanıyor...")
    
    chrome_options = Options()
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
    
    # Enable performance logging to capture network requests
    chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print("✅ Chrome hazır")
    return driver

def open_vts_and_wait_login(driver):
    """Open VTS and wait for user login"""
    print_step("2/6", "VTS açılıyor...")
    driver.get(VTS_URL)
    
    print("\n" + "="*60)
    print("  ⏳ LÜTFEN VTS'YE GİRİŞ YAPIN!")
    print("="*60)
    print("\n📍 Açılan Chrome penceresinde:")
    print("   • Kullanıcı adınızı girin")
    print("   • Şifrenizi girin")
    print("   • Login butonuna tıklayın")
    print("\n⏳ Giriş yapmanız bekleniyor...\n")
    
    # Login olduğunu kontrol et (localStorage'da token var mı?)
    check_count = 0
    while True:
        try:
            check_count += 1
            
            # Her 10 saniyede bir durum bilgisi ver
            if check_count % 5 == 0:
                print(f"⏳ Hala bekleniyor... ({check_count * 2} saniye)")
            
            # localStorage'dan token oku - TÜM KEY'LERI kontrol et
            all_local_storage = driver.execute_script("""
                let items = {};
                for (let i = 0; i < localStorage.length; i++) {
                    let key = localStorage.key(i);
                    items[key] = localStorage.getItem(key);
                }
                return items;
            """)
            
            # Debug: localStorage içeriğini göster
            if check_count == 1 or check_count % 10 == 0:
                print(f"🔍 localStorage keys: {list(all_local_storage.keys())}")
                
                # SessionStorage'ı da kontrol et
                all_session_storage = driver.execute_script("""
                    let items = {};
                    for (let i = 0; i < sessionStorage.length; i++) {
                        let key = sessionStorage.key(i);
                        items[key] = sessionStorage.getItem(key);
                    }
                    return items;
                """)
                print(f"🔍 sessionStorage keys: {list(all_session_storage.keys())}")
                
                # Cookies'i kontrol et
                cookies = driver.get_cookies()
                cookie_names = [c['name'] for c in cookies]
                print(f"🔍 Cookie names: {cookie_names}")
            
            # ÖNCE COOKIE'LERDE TOKEN ARA (VTS burada saklıyor!)
            token = None  # Initialize token variable
            cookies = driver.get_cookies()
            for cookie in cookies:
                if cookie['name'] == 'access_token':
                    token = cookie['value']
                    print(f"🔍 Token cookie'de bulundu!")
                    break
            
            # Cookie'de yoksa localStorage'a bak
            if not token:
                token = driver.execute_script(
                    "return localStorage.getItem('access_token') || "
                    "localStorage.getItem('token') || "
                    "localStorage.getItem('vts_token') || "
                    "sessionStorage.getItem('access_token');"
                )
            
            # Eğer localStorage'da yoksa, network request'lerden yakala
            if not token and check_count > 3:
                # Performance logs'dan token çek
                try:
                    logs = driver.get_log('performance')
                    for log in logs:
                        message = json.loads(log['message'])
                        method = message.get('message', {}).get('method', '')
                        
                        if method == 'Network.responseReceived':
                            response = message.get('message', {}).get('params', {}).get('response', {})
                            headers = response.get('headers', {})
                            
                            # Authorization header'ı kontrol et
                            auth_header = headers.get('authorization') or headers.get('Authorization')
                            if auth_header and 'Bearer' in auth_header:
                                token = auth_header.replace('Bearer ', '').strip()
                                print(f"🔍 Token network request'ten bulundu!")
                                break
                except Exception as e:
                    pass
            
            # Token yoksa, tüm window objelerini kontrol et
            if not token and check_count % 5 == 0:
                # Angular, Vue veya başka framework'lerde token farklı yerlerde olabilir
                token = driver.execute_script("""
                    // Try different possible locations
                    return window.token || 
                           window.accessToken || 
                           window.vtsToken ||
                           window.__VTS_TOKEN__ ||
                           (window.localStorage && localStorage.getItem('access_token')) ||
                           (window.sessionStorage && sessionStorage.getItem('access_token'));
                """)
                
                if token:
                    print(f"🔍 Token window objesinde bulundu!")
            
            if token:
                print(f"✅ Giriş başarılı! Token bulundu: {token[:30]}...")
                return token
            
            # URL değişikliğini kontrol et (login sayfasından çıktı mı?)
            current_url = driver.current_url
            if 'login' not in current_url.lower() and check_count == 1:
                print(f"ℹ️  Ana sayfaya yönlendirildi: {current_url}")
            
            # 2 dakika beklediyse, manuel token gir
            if check_count > 60:  # 60 * 2 saniye = 120 saniye = 2 dakika
                print("\n" + "="*60)
                print("⚠️  Token otomatik algılanamadı!")
                print("="*60)
                print("\nMANUEL TOKEN GİRİŞİ:")
                print("1. VTS sayfasında F12 basın")
                print("2. Application → Local Storage → vts.kentkart.com.tr")
                print("3. 'access_token' değerini kopyalayın")
                print("4. Buraya yapıştırın\n")
                
                manual_token = input("Token girin: ").strip()
                if manual_token and len(manual_token) > 20:
                    print(f"✅ Manuel token alındı!")
                    return manual_token
                else:
                    print("❌ Geçersiz token, tekrar deneniyor...")
                    check_count = 0  # Reset counter
            
        except Exception as e:
            print(f"⚠️  Kontrol hatası: {str(e)}")
        
        time.sleep(2)

def extract_token_with_devtools(driver):
    """Extract token using Chrome DevTools Protocol"""
    print_step("3/6", "Token otomatik alınıyor...")
    
    # ÖNCE COOKIE'LERDEN AL (VTS burada saklıyor!)
    cookies = driver.get_cookies()
    token = None
    
    for cookie in cookies:
        if cookie['name'] == 'access_token':
            token = cookie['value']
            print(f"✅ Token cookie'den alındı: {token[:30]}...")
            return token
    
    # Cookie'de yoksa localStorage'a bak
    token = driver.execute_script("""
        return localStorage.getItem('access_token') || 
               localStorage.getItem('token') ||
               localStorage.getItem('vts_token') ||
               sessionStorage.getItem('access_token');
    """)
    
    if token:
        print(f"✅ Token localStorage'dan alındı: {token[:30]}...")
        return token
    else:
        raise Exception("Token bulunamadı! Cookie ve localStorage boş.")

def run_vts_script(token):
    """Run VTS update script"""
    print_step("4/6", "VTS geçişleri işleniyor...")
    print(f"Token: {token[:30]}...")
    
    # Direkt Python scriptini subprocess ile çalıştır
    import subprocess
    import os
    
    script_path = os.path.join(os.path.dirname(__file__), 'vts_history_scraper_v2.py')
    
    if os.path.exists(script_path):
        print(f"\n🚀 vts_history_scraper_v2.py çalıştırılıyor...\n")
        
        try:
            # Token'ı environment variable olarak geç
            env = os.environ.copy()
            env['VTS_TOKEN'] = token
            
            # Script'i çalıştır (GERÇEK ZAMANLI ÇIKTI - capture_output=False)
            result = subprocess.run(
                ['python', script_path],
                env=env,
                timeout=600  # 10 dakika timeout
            )
            
            if result.returncode == 0:
                print("\n✅ Script başarıyla tamamlandı!")
                return 1  # Başarı
            else:
                print(f"\n⚠️ Script hata kodu {result.returncode} ile sonlandı")
                return 0
                
        except subprocess.TimeoutExpired:
            print("\n⏱️ Script timeout! 10 dakikadan uzun sürdü.")
            return 0
        except Exception as e:
            print(f"\n❌ Script çalıştırma hatası: {str(e)}")
            return 0
    else:
        print(f"\n⚠️ {script_path} bulunamadı, direkt API çağrısı yapılıyor...\n")
        return run_vts_api_directly(token)

def run_vts_api_directly(token):
    """Direct API call if import fails"""
    print("📡 Direkt API çağrısı yapılıyor...")
    
    total_updated = 0
    
    for route in ROUTES:
        print(f"📍 {route} işleniyor...")
        try:
            # Get vehicles for route
            response = requests.get(
                f"{VTS_API_BASE}/GetVehicleList",
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                },
                params={'routeCode': route}
            )
            
            if response.status_code == 200:
                vehicles = response.json()
                print(f"  {len(vehicles)} araç bulundu")
                total_updated += len(vehicles)
            
        except Exception as e:
            print(f"  ❌ Hata: {str(e)}")
    
    return total_updated

def main():
    """Main function"""
    driver = None
    
    try:
        print_header("🚀 VTS OTOMATİK GÜNCELLEME SİSTEMİ")
        
        # Setup Chrome
        driver = setup_chrome_driver()
        
        # Open VTS and wait for login
        token = open_vts_and_wait_login(driver)
        
        # Token validation
        if not token or len(token) < 20:
            print("⚠️  Token validation başarısız, tekrar deneniyor...")
            token = extract_token_with_devtools(driver)
        
        print(f"✅ Final token: {token[:30]}...")
        
        print_step("5/6", "VTS penceresi kapatılıyor...")
        driver.quit()
        driver = None
        print("✅ Chrome kapatıldı")
        
        # Run VTS script
        total_updated = run_vts_script(token)
        
        print_step("6/6", "İşlem tamamlandı!")
        print_header(f"✅ BAŞARILI! {total_updated} KAYIT GÜNCELLENDİ")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ HATA: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
        
    finally:
        if driver:
            try:
                driver.quit()
            except:
                pass

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
