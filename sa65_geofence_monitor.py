#!/usr/bin/env python3
"""
SA65 Geofence Monitor
Çoklu durak geçiş tespiti (Sarısu Depolama Merkezi-1 ve Gürsu Depolama)
"""

import math
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# DURAK 1: Sarısu Depolama Merkezi-1
DURAK_SARISU = {
    'adi': 'Sarısu Depolama Merkezi-1',
    'start_enlem': 36.830802,
    'start_boylam': 30.596277,
    'check_enlem': 36.830802,  # Eski sistemde tek nokta vardı
    'check_boylam': 30.596277,
    'mesafe_esik': 250.0,  # 250 metre (eski sistem için geniş zone)
    'yaricap_derece': 0.001,
    'izlenen_plakalar': None,  # None = tüm SA65 araçları
    'min_enlem': 36.829802,
    'max_enlem': 36.831802,
    'min_boylam': 30.595277,
    'max_boylam': 30.597277
}

# DURAK 2: Gürsu Depolama
DURAK_GURSU = {
    'adi': 'Gürsu Depolama',
    'start_enlem': 36.860848,
    'start_boylam': 30.625212,
    'check_enlem': 36.861859,
    'check_boylam': 30.626411,
    'mesafe_esik': 170.0,  # 170 metre (start -> check arası)
    'yaricap_derece': 0.0015,  # Zone boyutu
    'izlenen_plakalar': ['104', 'KC33', 'KC34', 'KC34A', 'KL21', 'MF40'],
    'min_enlem': 36.860848 - 0.0015,
    'max_enlem': 36.861859 + 0.0015,
    'min_boylam': 30.625212 - 0.0015,
    'max_boylam': 30.626411 + 0.0015
}

# Tüm duraklar listesi
DURAKLAR = [DURAK_SARISU, DURAK_GURSU]

# Araç durumları (her durak için ayrı state)
# Format: {durak_adi: {plaka: {'in_zone': bool, 'enter_time': datetime, ...}}}
vehicle_states = {}
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


def is_in_geofence(lat: float, lon: float, durak: Dict) -> bool:
    """
    Koordinatın geofence zone içinde olup olmadığını kontrol eder
    """
    if lat is None or lon is None:
        return False
    
    return (durak['min_enlem'] <= lat <= durak['max_enlem'] and
            durak['min_boylam'] <= lon <= durak['max_boylam'])


def check_direction_crossing(start_lat: float, start_lon: float, 
                            check_lat: float, check_lon: float,
                            vehicle_lat: float, vehicle_lon: float,
                            mesafe_esik: float) -> bool:
    """
    Yönlü geçiş kontrolü - Start point'ten Check point'e giderken aracın mesafesini kontrol eder
    
    Args:
        start_lat, start_lon: Başlangıç noktası (start point)
        check_lat, check_lon: Kontrol noktası (check point)
        vehicle_lat, vehicle_lon: Aracın konumu
        mesafe_esik: Maksimum mesafe eşiği (metre)
    
    Returns:
        True: Araç start-check güzergahında ve eşik mesafede
        False: Araç güzergah dışında veya çok uzakta
    """
    # Start'tan Check'e mesafe
    start_to_check = haversine_distance(start_lat, start_lon, check_lat, check_lon)
    
    # Start'tan araca mesafe
    start_to_vehicle = haversine_distance(start_lat, start_lon, vehicle_lat, vehicle_lon)
    
    # Check'ten araca mesafe
    check_to_vehicle = haversine_distance(check_lat, check_lon, vehicle_lat, vehicle_lon)
    
    # Araç, start ile check arasında mı? (üçgen eşitsizliği)
    # start->araç + araç->check ≈ start->check ise araç güzergahta demektir
    toplam_mesafe = start_to_vehicle + check_to_vehicle
    
    # Tolerans: %10
    if toplam_mesafe <= (start_to_check * 1.1) and start_to_vehicle <= mesafe_esik:
        return True
    
    return False


def check_vehicle_crossing_for_durak(vehicle: Dict, durak: Dict) -> Optional[Dict]:
    """
    Aracın belirli bir duraktan geçip geçmediğini kontrol eder
    2 saniye zone içinde kalırsa geçiş olarak kaydeder
    
    Args:
        vehicle: Araç bilgileri
        durak: Durak konfigürasyonu
    
    Returns:
        Geçiş bilgisi dict veya None
    """
    plaka = vehicle.get('car_no')
    lat = vehicle.get('lat')
    lon = vehicle.get('lon')
    
    if not plaka or lat is None or lon is None:
        return None
    
    # Plaka filtresi kontrolü
    if durak.get('izlenen_plakalar'):
        # Plaka normalizasyonu (07AU0215 -> AU0215, 104 -> 104)
        plaka_normalized = plaka.replace('07', '', 1) if plaka.startswith('07') else plaka
        
        # İzlenen plakalar listesinde var mı?
        izlenen = [p.replace('07', '', 1) if p.startswith('07') else p 
                   for p in durak['izlenen_plakalar']]
        
        if plaka_normalized not in izlenen:
            return None  # Bu plaka bu durak için izlenmiyor
    
    durak_adi = durak['adi']
    current_time = datetime.now()
    in_zone = is_in_geofence(lat, lon, durak)
    
    # Durak bazlı state yönetimi
    if durak_adi not in vehicle_states:
        vehicle_states[durak_adi] = {}
    
    # Araç state'ini al veya oluştur
    if plaka not in vehicle_states[durak_adi]:
        vehicle_states[durak_adi][plaka] = {
            'in_zone': False,
            'enter_time': None,
            'last_pos': None,
            'last_check': None
        }
    
    state = vehicle_states[durak_adi][plaka]
    
    # Zone'a yeni giriş
    if in_zone and not state['in_zone']:
        state['in_zone'] = True
        state['enter_time'] = current_time
        state['last_pos'] = (lat, lon)
        state['last_check'] = current_time
        print(f"🟡 [{durak_adi}] {plaka} zone'a girdi - {current_time.strftime('%H:%M:%S')}")
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
                    print(f"🟠 [{durak_adi}] {plaka} park halinde - hareket yok ({hareket_mesafesi:.1f}m)")
                    return None
            
            # Yönlü geçiş kontrolü (sadece check point tanımlı duraklarda)
            if 'check_enlem' in durak and 'check_boylam' in durak:
                yonlu_gecis = check_direction_crossing(
                    durak['start_enlem'], durak['start_boylam'],
                    durak['check_enlem'], durak['check_boylam'],
                    lat, lon,
                    durak['mesafe_esik']
                )
                
                if not yonlu_gecis:
                    print(f"🟠 [{durak_adi}] {plaka} yanlış yönden geçti, sayılmadı")
                    state['in_zone'] = False
                    state['enter_time'] = None
                    return None
            
            # Durağa olan mesafe (check point varsa ona, yoksa start point'e)
            ref_lat = durak.get('check_enlem', durak['start_enlem'])
            ref_lon = durak.get('check_boylam', durak['start_boylam'])
            
            mesafe = haversine_distance(ref_lat, ref_lon, lat, lon)
            
            gecis = {
                'plaka': plaka,
                'durak_adi': durak_adi,
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
            
            print(f"✅ [{durak_adi}] {plaka} duraktan geçti! {state['enter_time'].strftime('%H:%M:%S')} - Mesafe: {mesafe:.1f}m")
            
            # State'i sıfırla (bir sonraki geçiş için)
            state['in_zone'] = False
            state['enter_time'] = None
            
            return gecis
    
    # Zone'dan çıktı
    elif not in_zone and state['in_zone']:
        time_in_zone = (current_time - state['enter_time']).total_seconds()
        
        # 2 saniyeden kısa süre kaldıysa geçiş sayma
        if time_in_zone < 2.0:
            print(f"🟠 [{durak_adi}] {plaka} zone'dan çıktı (çok hızlı: {time_in_zone:.1f}s)")
        
        state['in_zone'] = False
        state['enter_time'] = None
    
    return None


def check_vehicle_crossing(vehicle: Dict) -> List[Dict]:
    """
    Aracın TÜM duraklardan geçişini kontrol eder
    
    Returns:
        Geçiş bilgileri listesi (her durak için ayrı dict)
    """
    gecisler = []
    
    for durak in DURAKLAR:
        gecis = check_vehicle_crossing_for_durak(vehicle, durak)
        if gecis:
            gecisler.append(gecis)
    
    return gecisler


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
    print("🎯 DURAK KONFİGÜRASYONLARI\n")
    
    for durak in DURAKLAR:
        print(f"📍 {durak['adi']}")
        print(f"   Start Point: {durak['start_enlem']}, {durak['start_boylam']}")
        if 'check_enlem' in durak:
            print(f"   Check Point: {durak['check_enlem']}, {durak['check_boylam']}")
            start_to_check = haversine_distance(
                durak['start_enlem'], durak['start_boylam'],
                durak['check_enlem'], durak['check_boylam']
            )
            print(f"   Start->Check: {start_to_check:.1f}m (Eşik: {durak['mesafe_esik']}m)")
        print(f"   Zone: [{durak['min_enlem']:.6f} - {durak['max_enlem']:.6f}] x [{durak['min_boylam']:.6f} - {durak['max_boylam']:.6f}]")
        if durak.get('izlenen_plakalar'):
            print(f"   İzlenen plakalar: {', '.join(durak['izlenen_plakalar'])}")
        else:
            print(f"   İzlenen plakalar: TÜM SA65 ARAÇLARI")
        print()
    
    # Test verileri - Sarısu için
    print("\n🧪 TEST 1: Sarısu Depolama")
    test_sarisu = [
        {'car_no': '07AU0338', 'lat': 36.830802, 'lon': 30.596277, 'speed': 20},
        {'car_no': '07AU0275', 'lat': 36.831500, 'lon': 30.596000, 'speed': 15},
    ]
    
    for vehicle in test_sarisu:
        in_zone = is_in_geofence(vehicle['lat'], vehicle['lon'], DURAK_SARISU)
        mesafe = haversine_distance(
            DURAK_SARISU['start_enlem'], 
            DURAK_SARISU['start_boylam'],
            vehicle['lat'], 
            vehicle['lon']
        )
        print(f"{vehicle['car_no']}: Zone içinde: {in_zone}, Mesafe: {mesafe:.1f}m")
    
    # Test verileri - Gürsu için
    print("\n🧪 TEST 2: Gürsu Depolama")
    test_gursu = [
        {'car_no': '07KC34', 'lat': 36.860848, 'lon': 30.625212, 'speed': 25},  # Start point
        {'car_no': '07KC34', 'lat': 36.861859, 'lon': 30.626411, 'speed': 20},  # Check point
        {'car_no': '104', 'lat': 36.861200, 'lon': 30.625800, 'speed': 22},     # Arada
    ]
    
    for vehicle in test_gursu:
        in_zone = is_in_geofence(vehicle['lat'], vehicle['lon'], DURAK_GURSU)
        mesafe_start = haversine_distance(
            DURAK_GURSU['start_enlem'], 
            DURAK_GURSU['start_boylam'],
            vehicle['lat'], 
            vehicle['lon']
        )
        mesafe_check = haversine_distance(
            DURAK_GURSU['check_enlem'], 
            DURAK_GURSU['check_boylam'],
            vehicle['lat'], 
            vehicle['lon']
        )
        yonlu = check_direction_crossing(
            DURAK_GURSU['start_enlem'], DURAK_GURSU['start_boylam'],
            DURAK_GURSU['check_enlem'], DURAK_GURSU['check_boylam'],
            vehicle['lat'], vehicle['lon'],
            DURAK_GURSU['mesafe_esik']
        )
        print(f"{vehicle['car_no']}: Zone={in_zone}, Start={mesafe_start:.1f}m, Check={mesafe_check:.1f}m, Yönlü={yonlu}")

