#!/usr/bin/env python3
"""
VTS Real-time Data Pusher
SA65 araçlarını VTS'den çekip Bus Control API'ye gönderir
Her 5 saniyede bir günceller
"""

import requests
import json
import time
from datetime import datetime

# Konfigürasyon
VTS_API_URL = "https://vts.kentkart.com.tr/api/026/v1/latestdevicedata/get"
BUSCONTROL_API = "https://bus-control-4i5o.vercel.app/api/vts-push-data"

# VTS'den giriş yaptıktan sonra cookie değerlerini buraya yapıştırın
VTS_COOKIES = {
    # Örnek: 'session': 'your_session_cookie_here',
    # Örnek: 'JSESSIONID': 'your_jsessionid_here'
}

# Header'lar
VTS_HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://vts.kentkart.com.tr/'
}

def fetch_vts_data():
    """VTS'den SA65 araç verilerini çeker"""
    try:
        params = {
            'fields': 'bus_id,car_no,display_route_code,lat,lon,speed,status,path_name,comp_name,personel_name,personel_last_name,bearing,date_time,odometer',
            'sort': 'bus_id|asc',
            'stationlist': '',
            'dc': int(time.time() * 1000)
        }
        
        response = requests.get(
            VTS_API_URL,
            params=params,
            headers=VTS_HEADERS,
            cookies=VTS_COOKIES,
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ VTS API Error: {response.status_code}")
            return None
            
        data = response.json()
        all_vehicles = data.get('data', {}).get('data', [])
        
        # SA65 filtrele
        sa65_vehicles = [
            v for v in all_vehicles
            if 'SA65' in str(v.get('display_route_code', '')) or
               'SA-65' in str(v.get('display_route_code', '')) or
               'SA65' in str(v.get('path_name', ''))
        ]
        
        print(f"✅ VTS: {len(all_vehicles)} toplam, {len(sa65_vehicles)} SA65 araç")
        return sa65_vehicles
        
    except Exception as e:
        print(f"❌ VTS fetch error: {e}")
        return None

def push_to_buscontrol(vehicles):
    """Bus Control API'ye veri gönderir"""
    try:
        payload = {
            'timestamp': datetime.now().isoformat(),
            'vehicles': vehicles,
            'count': len(vehicles)
        }
        
        response = requests.post(
            BUSCONTROL_API,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Bus Control API: {len(vehicles)} araç gönderildi")
            return True
        else:
            print(f"⚠️ Bus Control API: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Push error: {e}")
        return False

def main():
    """Ana loop - her 5 saniyede bir çalışır"""
    print("🚀 VTS Real-time Pusher başlatıldı!")
    print("📡 Her 5 saniyede SA65 verileri güncellenecek...")
    print("-" * 50)
    
    iteration = 0
    
    while True:
        try:
            iteration += 1
            now = datetime.now().strftime("%H:%M:%S")
            print(f"\n[{now}] 🔄 İterasyon #{iteration}")
            
            # VTS'den veri çek
            vehicles = fetch_vts_data()
            
            if vehicles:
                # Koordinatları ve hızları göster
                for v in vehicles:
                    status = "🟢" if v.get('status') == 1 else "🔴"
                    print(f"  {status} {v.get('car_no')}: Lat={v.get('lat')}, Lon={v.get('lon')}, Hız={v.get('speed')} km/h")
                
                # Bus Control'e gönder
                push_to_buscontrol(vehicles)
            else:
                print("⚠️ Veri alınamadı, tekrar denenecek...")
            
            # 5 saniye bekle
            print(f"⏳ 5 saniye bekleniyor...")
            time.sleep(5)
            
        except KeyboardInterrupt:
            print("\n\n⏹️ Pusher durduruldu.")
            break
        except Exception as e:
            print(f"❌ Hata: {e}")
            time.sleep(5)

if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════════╗
║  VTS Real-time Data Pusher                                 ║
║  SA65 araçlarını canlı takip için                          ║
╚════════════════════════════════════════════════════════════╝

⚠️  ÖNEMLI: VTS Cookie'lerini yapılandırın!

1. Chrome'da VTS'ye giriş yapın
2. F12 → Application → Cookies → vts.kentkart.com.tr
3. Cookie değerlerini bu dosyada VTS_COOKIES değişkenine yapıştırın
4. python vts_realtime_pusher.py komutuyla başlatın

""")
    
    if not VTS_COOKIES or all(v == '' for v in VTS_COOKIES.values()):
        print("⚠️  VTS_COOKIES boş! Lütfen cookie'leri yapılandırın.")
        print("    Devam etmek için Enter'a basın (test modunda çalışacak)")
        input()
    
    main()
