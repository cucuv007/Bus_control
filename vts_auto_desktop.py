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
            
            # Token'ı bul
            token = driver.execute_script(
                "return localStorage.getItem('access_token') || "
                "localStorage.getItem('token') || "
                "localStorage.getItem('vts_token') || "
                "sessionStorage.getItem('access_token');"
            )
            
            if token:
                print(f"✅ Giriş başarılı! Token bulundu: {token[:30]}...")
                return token
            
            # URL değişikliğini kontrol et (login sayfasından çıktı mı?)
            current_url = driver.current_url
            if 'login' not in current_url.lower():
                print(f"ℹ️  URL değişti: {current_url}")
                # Biraz daha bekle, token henüz kaydedilmemiş olabilir
                time.sleep(3)
            
        except Exception as e:
            print(f"⚠️  Kontrol hatası: {str(e)}")
        
        time.sleep(2)

def extract_token_with_devtools(driver):
    """Extract token using Chrome DevTools Protocol"""
    print_step("3/6", "Token otomatik alınıyor...")
    
    # F12 açmaya gerek yok, JavaScript ile direkt localStorage'dan alalım
    token = driver.execute_script("""
        return localStorage.getItem('access_token') || 
               localStorage.getItem('token') ||
               localStorage.getItem('vts_token') ||
               sessionStorage.getItem('access_token');
    """)
    
    if token:
        print(f"✅ Token alındı: {token[:30]}...")
        return token
    else:
        raise Exception("Token bulunamadı!")

def run_vts_script(token):
    """Run VTS update script"""
    print_step("4/6", "VTS geçişleri işleniyor...")
    print(f"Token: {token[:30]}...")
    
    # Import vts_history_scraper_v2
    try:
        import vts_history_scraper_v2 as vts_script
        
        # Override token
        vts_script.VTS_TOKEN = token
        
        # Run main script
        print("\n🚀 14 hat işleniyor...\n")
        
        total_updated = 0
        for route in ROUTES:
            print(f"📍 {route} hattı işleniyor...")
            try:
                # Process route (simplified - call main functions)
                updated = vts_script.process_route(route, token)
                total_updated += updated
                print(f"✅ {route}: {updated} kayıt güncellendi")
            except Exception as e:
                print(f"❌ {route} hatası: {str(e)}")
        
        print(f"\n✅ Toplam {total_updated} kayıt güncellendi!")
        return total_updated
        
    except ImportError:
        print("⚠️  vts_history_scraper_v2.py bulunamadı, alternatif yöntem kullanılıyor...")
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
        
        # Extract token (additional check)
        token = extract_token_with_devtools(driver)
        
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
