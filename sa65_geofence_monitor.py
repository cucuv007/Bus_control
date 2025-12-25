#!/usr/bin/env python3
"""
SA65 Geofence Monitor
Sarısu Depolama Merkezi-1 durak geçişlerini tespit eder
"""

import math
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# Sarısu Depolama Merkezi-1 Durak Koordinatları
DURAK_CONFIG = {
    'adi': 'Sarısu Depolama Merkezi-1',
    'enlem': 36.830802,
    'boylam': 30.596277,
    'yaricap_derece': 0.001,  # ±0.001°
    'min_enlem': 36.829802,   # 36.830802 - 0.001
    'max_enlem': 36.831802,   # 36.830802 + 0.001
    'min_boylam': 30.595277,  # 30.596277 - 0.001
    'max_boylam': 30.597277   # 30.596277 + 0.001
}

# Araç durumları (zone içinde mi?)
vehicle_states = {}  # {plaka: {'in_zone': bool, 'enter_time': datetime, 'last_pos': tuple}}
gecis_kayitlari = []  # Tespit edilen geçişler


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    İki koordinat arasındaki mesafeyi metre cinsinden hesaplar (Haversine formülü)
    """
    R = 6371000  # Dünya yarıçapı (metre)
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def is_in_geofence(lat: float, lon: float) -> bool:
    """
    Koordinatın geofence zone içinde olup olmadığını kontrol eder
    """
    if lat is None or lon is None:
        return False
    
    return (DURAK_CONFIG['min_enlem'] <= lat <= DURAK_CONFIG['max_enlem'] and
            DURAK_CONFIG['min_boylam'] <= lon <= DURAK_CONFIG['max_boylam'])


def check_vehicle_crossing(vehicle: Dict) -> Optional[Dict]:
    """
    Aracın duraktan geçip geçmediğini kontrol eder
    2 saniye zone içinde kalırsa geçiş olarak kaydeder
    
    Returns:
        Geçiş bilgisi dict veya None
    """
    plaka = vehicle.get('car_no')
    lat = vehicle.get('lat')
    lon = vehicle.get('lon')
    
    if not plaka or lat is None or lon is None:
        return None
    
    current_time = datetime.now()
    in_zone = is_in_geofence(lat, lon)
    
    # Araç state'ini al veya oluştur
    if plaka not in vehicle_states:
        vehicle_states[plaka] = {
            'in_zone': False,
            'enter_time': None,
            'last_pos': None,
            'last_check': None
        }
    
    state = vehicle_states[plaka]
    
    # Zone'a yeni giriş
    if in_zone and not state['in_zone']:
        state['in_zone'] = True
        state['enter_time'] = current_time
        state['last_pos'] = (lat, lon)
        state['last_check'] = current_time
        print(f"🟡 {plaka} zone'a girdi - {current_time.strftime('%H:%M:%S')}")
        return None
    
    # Zone içinde devam ediyor
    elif in_zone and state['in_zone']:
        time_in_zone = (current_time - state['enter_time']).total_seconds()
        state['last_check'] = current_time
        
        # 2 saniye zone içinde kaldıysa VE konum değiştiyse geçiş yaptı
        if time_in_zone >= 2.0:
            # Konum değişimi kontrolü (en az 5 metre hareket etmeli)
            if state['last_pos']:
                hareket_mesafesi = haversine_distance(
                    state['last_pos'][0], state['last_pos'][1],
                    lat, lon
                )
                
                # Park halinde mi? (5 metreden az hareket)
                if hareket_mesafesi < 5.0:
                    print(f"🟠 {plaka} park halinde - hareket yok ({hareket_mesafesi:.1f}m)")
                    # Zone'dan çıkana kadar bekle
                    return None
            
            # Durağa olan mesafe
            mesafe = haversine_distance(
                DURAK_CONFIG['enlem'], 
                DURAK_CONFIG['boylam'],
                lat, lon
            )
            
            gecis = {
                'plaka': plaka,
                'durak_adi': DURAK_CONFIG['adi'],
                'gecis_zamani': state['enter_time'],
                'arac_enlem': lat,
                'arac_boylam': lon,
                'mesafe_metre': round(mesafe, 2),
                'hiz': vehicle.get('speed', 0),
                'hat_kodu': vehicle.get('display_route_code'),
                'rota': vehicle.get('path_name'),
                'surucu': f"{vehicle.get('personel_name', '')} {vehicle.get('personel_last_name', '')}".strip(),
                'sirket': vehicle.get('comp_name')
            }
            
            # Geçişi kaydet
            gecis_kayitlari.append(gecis)
            
            print(f"✅ {plaka} duraktan geçti! {state['enter_time'].strftime('%H:%M:%S')} - Mesafe: {mesafe:.1f}m")
            
            # State'i sıfırla (bir sonraki geçiş için)
            state['in_zone'] = False
            state['enter_time'] = None
            
            return gecis
    
    # Zone'dan çıktı
    elif not in_zone and state['in_zone']:
        time_in_zone = (current_time - state['enter_time']).total_seconds()
        
        # 2 saniyeden kısa süre kaldıysa geçiş sayma
        if time_in_zone < 2.0:
            print(f"🟠 {plaka} zone'dan çıktı (çok hızlı: {time_in_zone:.1f}s)")
        
        state['in_zone'] = False
        state['enter_time'] = None
    
    return None


def get_gecis_raporu(tarih: str = None) -> List[Dict]:
    """
    Belirli bir tarihteki geçişleri döndürür
    tarih: 'YYYY-MM-DD' formatında veya None (bugün)
    """
    if tarih is None:
        tarih = datetime.now().strftime('%Y-%m-%d')
    
    return [
        g for g in gecis_kayitlari
        if g['gecis_zamani'].strftime('%Y-%m-%d') == tarih
    ]


def print_gecis_raporu():
    """Geçiş raporunu konsola yazdırır"""
    if not gecis_kayitlari:
        print("\n📊 Henüz geçiş kaydı yok.")
        return
    
    print(f"\n📊 Toplam {len(gecis_kayitlari)} geçiş kaydı:")
    print("-" * 80)
    
    for i, gecis in enumerate(gecis_kayitlari, 1):
        print(f"{i}. {gecis['plaka']} - {gecis['gecis_zamani'].strftime('%H:%M:%S')} - {gecis['mesafe_metre']}m")
    
    print("-" * 80)


# Test fonksiyonu
if __name__ == "__main__":
    # Test verileri
    test_vehicles = [
        {'car_no': '07AU0338', 'lat': 36.830802, 'lon': 30.596277, 'speed': 20},  # Tam merkezde
        {'car_no': '07AU0275', 'lat': 36.831500, 'lon': 30.596000, 'speed': 15},  # Zone içinde
        {'car_no': '07MKL43', 'lat': 36.835000, 'lon': 30.600000, 'speed': 30},   # Zone dışında
    ]
    
    print(f"🎯 Durak: {DURAK_CONFIG['adi']}")
    print(f"📍 Merkez: {DURAK_CONFIG['enlem']}, {DURAK_CONFIG['boylam']}")
    print(f"📏 Yarıçap: ±{DURAK_CONFIG['yaricap_derece']}°")
    print(f"📐 Enlem aralığı: {DURAK_CONFIG['min_enlem']} - {DURAK_CONFIG['max_enlem']}")
    print(f"📐 Boylam aralığı: {DURAK_CONFIG['min_boylam']} - {DURAK_CONFIG['max_boylam']}")
    print()
    
    for vehicle in test_vehicles:
        in_zone = is_in_geofence(vehicle['lat'], vehicle['lon'])
        mesafe = haversine_distance(
            DURAK_CONFIG['enlem'], 
            DURAK_CONFIG['boylam'],
            vehicle['lat'], 
            vehicle['lon']
        )
        
        print(f"{vehicle['car_no']}: Zone içinde: {in_zone}, Mesafe: {mesafe:.1f}m")
