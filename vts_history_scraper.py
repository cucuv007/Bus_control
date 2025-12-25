#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VTS History Scraper
VTS web arayüzünden araç geçmiş verilerini çeker
Bugün 06:00'dan itibaren SA65 araçlarının durak geçişlerini analiz eder
"""

import requests
import json
from datetime import datetime, timedelta
from sa65_geofence_monitor import check_vehicle_crossing, DURAK_CONFIG

# VTS API yapılandırması
VTS_BASE_URL = "https://vts.kentkart.com.tr/api/026/v1"

# Cookie'leriniz
VTS_COOKIES = {
    'access_token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjM1MTIsImF1ZCI6IjMiLCJleHAiOjE3NjU2MTU0MTAsIm5iZiI6MTc2NTQ0MjYxMCwiaWF0IjoxNzY1NDQyNjEwLCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRrIiwiYjNBNFZUUyJdLCJleHQiOm51bGwsImlzU3VwZXJBZG1pbiI6MCwiaXAiOiIxMC4wLjQwLjgiLCJsb2dpbm1ldGhvZCI6bnVsbCwiYWNjcm9sZSI6bnVsbCwicm9sZSI6WyJ2dHNhZG1pbiJdLCJuZXRzIjpbeyJOSUQiOiIwMjYiLCJEIjoiMSIsIk5BTUUiOiJBTlRBTFlBIn1dLCJsYW5nIjoidHIiLCJ1c2VybmFtZSI6InVndXIueWlsbWF6Iiwic2lkIjo1MTA2OTI5fQ.FzBBX7OHXHqiHW_m4wgvUTN6iVjLiJQmafabMwqL1xPU9HDaO78f8uF5VtmZ1ma6WoD-weDwEfqeJyyhC_bS0lTnUjwvmIOXVnd9kK8Qc8pcxLlrAVm4_8_B-7ReRigwtn5e1abU1HESgKWIQzPr1_cw9qEWqPPDK6cm6c9T27Wg_5Zc_YQac68hFS-5-VsEigK72xva9CctrKzMlnVO4UN536PlTLv8wnjeefCwr6EB47Ri4_BImoqJlqgKTJyNe3RAmVCXb3Px-c6kKCJtWwgRj3GqwbzRGGeXJv6z1j1OXPzfF2EeJjAtEP7BwXJMzdJW8DIr0zZkRc41h1qiBA',
    'network_id': '026',
    'iframe': '1',
    'SERVERIDVTS': 'vts13'
}

VTS_HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://vts.kentkart.com.tr/',
    'Authorization': f'Bearer {VTS_COOKIES.get("access_token", "")}'
}

# SA65 araçları (bus_id'ler ile)
SA65_VEHICLES = [
    {'bus_id': '71447', 'plaka': '07AAU919'},
    {'bus_id': '73008', 'plaka': '07AU0108'},
    {'bus_id': '75238', 'plaka': '07AU0415'},
    {'bus_id': '75579', 'plaka': '07AU0338'},
    {'bus_id': '75890', 'plaka': '07AU0275'},
    {'bus_id': '75925', 'plaka': '07AU0028'}
]

def get_vehicle_list():
    """VTS'den tüm araçları çeker ve SA65 olanları filtreler"""
    try:
        url = f"{VTS_BASE_URL}/latestdevicedata/get"
        params = {
            'fields': 'bus_id,car_no,display_route_code',
            'sort': 'bus_id|asc',
            'dc': int(datetime.now().timestamp() * 1000)
        }
        
        response = requests.get(
            url,
            params=params,
            headers=VTS_HEADERS,
            cookies=VTS_COOKIES,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            vehicles = []
            
            # VTS bazen string, bazen dict döndürüyor
            if isinstance(data, str):
                data = json.loads(data)
            
            data_list = data.get('data', []) if isinstance(data, dict) else []
            
            for vehicle in data_list:
                if vehicle.get('display_route_code') == 'SA65':
                    vehicles.append({
                        'bus_id': vehicle.get('bus_id'),
                        'plaka': vehicle.get('car_no')
                    })
            
            return vehicles
        
    except Exception as e:
        print(f"❌ Araç listesi alınamadı: {e}")
    
    return []

def get_vehicle_history(bus_id, start_time, end_time):
    """
    Bir aracın belirli zaman aralığındaki konum geçmişini çeker
    VTS historicdevicedata endpoint'ini kullanır
    """
    
    try:
        # VTS tarihleri: YYYYMMDDHHmmss formatında
        start_str = start_time.strftime('%Y%m%d%H%M%S')
        end_str = end_time.strftime('%Y%m%d%H%M%S')
        
        url = f"{VTS_BASE_URL}/historicdevicedata/get"
        
        params = {
            'fields': 'date_time,lat,lon,speed,car_no,bus_id,display_route_code,path_name,comp_name,personel_name,personel_last_name,bearing,odometer,status',
            'filters': '',
            'sort': 'date_time|asc',
            'bus_list': bus_id,
            'start_date_time': start_str,
            'end_date_time': end_str,
            'dc': int(datetime.now().timestamp() * 1000)
        }
        
        response = requests.get(
            url,
            params=params,
            headers=VTS_HEADERS,
            cookies=VTS_COOKIES,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # VTS bazen string döndürüyor
            if isinstance(data, str):
                data = json.loads(data)
            
            return data
        else:
            print(f"   ❌ Status: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"   ❌ Hata: {e}")
        return None

def analyze_history_for_crossings(history_data, plaka):
    """Geçmiş konum verilerini analiz edip durak geçişlerini tespit eder"""
    
    if not history_data:
        return []
    
    # VTS bazen string döndürüyor
    if isinstance(history_data, str):
        try:
            history_data = json.loads(history_data)
        except:
            print(f"   ❌ JSON parse hatası")
            return []
    
    # VTS historicdevicedata formatı: {'data': {'data': [...]}, 'result': ...}
    tracks = []
    
    if isinstance(history_data, dict):
        # İç içe data key'leri
        inner_data = history_data.get('data', {})
        if isinstance(inner_data, dict):
            tracks = inner_data.get('data', [])
        elif isinstance(inner_data, list):
            tracks = inner_data
    elif isinstance(history_data, list):
        tracks = history_data
    
    if not tracks:
        print(f"   ⚠️  Veri boş")
        return []
    
    print(f"   📍 {len(tracks)} konum noktası bulundu")
    
    # Debug: İlk noktayı göster
    if tracks:
        print(f"   🔍 İlk nokta tipi: {type(tracks[0])}")
        print(f"   🔍 İlk nokta: {tracks[0]}")
    
    gecisler = []
    in_zone = False
    entry_time = None
    entry_pos = None
    
    for point in tracks:
        lat = point.get('lat')
        lon = point.get('lon')
        
        if not lat or not lon:
            continue
        
        # Geofence içinde mi?
        lat_in = DURAK_CONFIG['min_enlem'] <= lat <= DURAK_CONFIG['max_enlem']
        lon_in = DURAK_CONFIG['min_boylam'] <= lon <= DURAK_CONFIG['max_boylam']
        is_in_zone = lat_in and lon_in
        
        # Zone'a yeni girdi
        if is_in_zone and not in_zone:
            in_zone = True
            entry_time = point.get('date_time')
            entry_pos = (lat, lon)
            
        # Zone'da 2 saniyeden fazla kaldı mı?
        elif is_in_zone and in_zone and entry_time:
            try:
                # VTS tarihi parse et: "20251211134215" formatında
                current_time_str = point.get('date_time')
                if current_time_str and len(current_time_str) >= 14:
                    # YYYYMMDDHHmmss -> datetime
                    current_time = datetime.strptime(current_time_str[:14], '%Y%m%d%H%M%S')
                    entry_dt = datetime.strptime(entry_time[:14], '%Y%m%d%H%M%S')
                    duration = (current_time - entry_dt).total_seconds()
                    
                    if duration >= 2.0:
                        # Hareket kontrolü
                        if entry_pos:
                            from sa65_geofence_monitor import haversine_distance
                            moved = haversine_distance(entry_pos[0], entry_pos[1], lat, lon)
                            
                            if moved >= 5.0:  # En az 5m hareket
                                from sa65_geofence_monitor import haversine_distance
                                mesafe = haversine_distance(
                                    DURAK_CONFIG['enlem'],
                                    DURAK_CONFIG['boylam'],
                                    lat, lon
                                )
                                
                                gecis = {
                                    'plaka': plaka,
                                    'durak_adi': DURAK_CONFIG['adi'],
                                    'gecis_zamani': entry_dt,
                                    'arac_enlem': lat,
                                    'arac_boylam': lon,
                                    'mesafe_metre': round(mesafe, 2),
                                    'hiz': point.get('speed', 0),
                                    'hat_kodu': point.get('display_route_code'),
                                    'rota': point.get('path_name'),
                                    'surucu': f"{point.get('personel_name', '')} {point.get('personel_last_name', '')}".strip(),
                                    'sirket': point.get('comp_name')
                                }
                                
                                gecisler.append(gecis)
                                in_zone = False
                                entry_time = None
                                entry_pos = None
            except:
                pass
        
        # Zone'dan çıktı
        elif not is_in_zone and in_zone:
            in_zone = False
            entry_time = None
            entry_pos = None
    
    return gecisler

def main():
    print("\n" + "="*70)
    print("🕐 VTS GEÇMİŞ VERİ ANALİZİ - DURAK GEÇİŞLERİ")
    print("="*70 + "\n")
    
    # Zaman aralığı: Bugün 06:00 - Şimdi
    bugun = datetime.now().date()
    baslangic = datetime.combine(bugun, datetime.strptime("06:00:00", "%H:%M:%S").time())
    bitis = datetime.now()
    
    print(f"📅 Tarih: {bugun.strftime('%d.%m.%Y')}")
    print(f"🕐 Saat Aralığı: {baslangic.strftime('%H:%M')} - {bitis.strftime('%H:%M')}")
    print(f"🎯 Durak: {DURAK_CONFIG['adi']}")
    print(f"📍 Koordinat: {DURAK_CONFIG['enlem']}, {DURAK_CONFIG['boylam']}")
    print("-" * 70)
    
    # SA65 araçlarını al
    print("\n🚌 SA65 araçları getiriliyor...")
    vehicles = get_vehicle_list()
    
    if not vehicles:
        print("⚠️  Araç listesi alınamadı, bilinen araçlar kullanılacak")
        vehicles = SA65_VEHICLES
    
    print(f"✅ {len(vehicles)} SA65 aracı bulundu\n")
    
    tum_gecisler = []
    
    # Her araç için geçmiş verileri çek
    for vehicle in vehicles:
        plaka = vehicle['plaka']
        bus_id = vehicle['bus_id']
        
        print(f"\n🔍 {plaka} için geçmiş veriler çekiliyor...")
        
        if not bus_id:
            print("   ⚠️  Bus ID yok, atlanıyor")
            continue
        
        history = get_vehicle_history(bus_id, baslangic, bitis)
        
        if history:
            gecisler = analyze_history_for_crossings(history, plaka)
            tum_gecisler.extend(gecisler)
            print(f"   ✅ {len(gecisler)} geçiş tespit edildi")
        else:
            print(f"   ❌ Geçmiş veri alınamadı")
    
    # Sonuçları göster
    print("\n" + "="*70)
    print(f"📊 TOPLAM {len(tum_gecisler)} GEÇİŞ TESPİT EDİLDİ")
    print("="*70 + "\n")
    
    if tum_gecisler:
        # Plakaya göre grupla
        from collections import defaultdict
        plaka_gecisleri = defaultdict(list)
        
        for gecis in tum_gecisler:
            plaka_gecisleri[gecis['plaka']].append(gecis)
        
        for plaka, gecisler in sorted(plaka_gecisleri.items()):
            print(f"\n🚍 {plaka}: {len(gecisler)} geçiş")
            for gecis in sorted(gecisler, key=lambda x: x['gecis_zamani']):
                print(f"   • {gecis['gecis_zamani'].strftime('%H:%M:%S')} - Mesafe: {gecis['mesafe_metre']:.1f}m")
    else:
        print("⚠️  Hiç geçiş tespit edilemedi")
        print("\nOlası sebepler:")
        print("• VTS history API endpoint'leri bulunamadı")
        print("• Web arayüzü farklı bir yöntem kullanıyor")
        print("• Selenium ile tarayıcı otomasyonu gerekebilir")

if __name__ == '__main__':
    main()
