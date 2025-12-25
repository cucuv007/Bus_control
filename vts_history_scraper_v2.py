#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VTS History Scraper V2
Gelişmiş Geçiş Tespit Mantığı:
- Durağa yaklaşma: Mesafe azalır
- Duraktan uzaklaşma: Mesafe artar
- Geçiş: Uzaklaşırken 100m'yi geçtiğinde sayılır (lineer artış)
"""

import sys
import io

# Windows console encoding fix
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import requests
import json
from datetime import datetime

# VTS API
VTS_BASE_URL = "https://vts.kentkart.com.tr/api/026/v1"

# Token'ı environment variable'dan al (vts_auto_desktop.py tarafından set edilir)
import os
AUTO_TOKEN = os.environ.get('VTS_TOKEN')

# Cookie'lerinizi buraya güncelleyin (veya environment variable kullanılır)
VTS_COOKIES = {
    'access_token': AUTO_TOKEN if AUTO_TOKEN else 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjQyMDEsImF1ZCI6IjMiLCJleHAiOjE3NjYxMzA5MTMsIm5iZiI6MTc2NTk1ODExMywiaWF0IjoxNzY1OTU4MTEzLCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRWVFMiXSwiZXh0IjpudWxsLCJpc1N1cGVyQWRtaW4iOjAsImlwIjoiMTAuMC40MC44IiwibG9naW5tZXRob2QiOm51bGwsImFjY3JvbGUiOm51bGwsInJvbGUiOlsidnRzYWRtaW4iXSwibmV0cyI6W3siTklEIjoiMDI2IiwiRCI6IjEiLCJOQU1FIjoiQU5UQUxZQSJ9XSwibGFuZyI6InRyIiwidXNlcm5hbWUiOiJ1dGt1Lmt1cnVjdSIsInNpZCI6NTExMzY4Mn0.OpLdct_mAAFlvARSiN2PQNmMQTvErz0d_P9ottOX7e9DCggBa-RRoUdgMXgMIwbcC5uLpDLfKmt1kQTfPfSOvtn7TeVa6TOFNlLe25gwMGO-g--upVSYjm_ZKgoL1RLJFcx4C7JPQYLQtoITZewp861UrJKDtLuHHlMGt_Bfj94G4uofo0F7nXha6TObZS0_5ykd3bfoomDTsPIfKnYJmay6ULgvekFn1KEH4n4BwqxX6mtbGMJGBN-CIIiV7yZiM8j7XLMIJDJE9jC9VaqkXY-QESDpezPtGSXDYfRItPY8s7IMbXIVGI24FbWHn8eCkTusiRe-5hZaFNWyhmxT5w',
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

# Debug: Token kaynağını göster
if AUTO_TOKEN:
    print(f"[OK] Token environment variable'dan alindi: {AUTO_TOKEN[:30]}...")
else:
    print("[INFO] Token hardcoded deger kullaniliyor (manuel calistirma)")

# Durak koordinatları
DURAK_CONFIG = {
    'adi': 'Sarısu Depolama Merkezi-1',
    'enlem': 36.830802,
    'boylam': 30.596277
}

# İlk koordinat (Başlangıç noktası - otobüsler buradan gelir)
START_POINT = {
    'enlem': 36.830803,
    'boylam': 30.596275
}

# İkinci kontrol noktası (Hedef yön - gerçek çıkışlar bu yöne gider)
KONTROL_NOKTASI = {
    'enlem': 36.836035,
    'boylam': 30.595817
}

def haversine_distance(lat1, lon1, lat2, lon2):
    """İki koordinat arası mesafe (metre)"""
    from math import radians, cos, sin, asin, sqrt
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km * 1000  # metre

def calculate_bearing(lat1, lon1, lat2, lon2):
    """İki nokta arası yön açısı hesapla (derece, 0-360)"""
    from math import radians, degrees, cos, sin, atan2
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    
    x = sin(dlon) * cos(lat2)
    y = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dlon)
    
    bearing = atan2(x, y)
    bearing = degrees(bearing)
    bearing = (bearing + 360) % 360
    
    return bearing

def is_correct_direction(lat, lon):
    """Otobüs doğru yönden mi geliyor? (Başlangıç → Durak yönünde)"""
    # Beklenen yön: Başlangıç koordinatından durağa
    expected_bearing = calculate_bearing(
        START_POINT['enlem'],
        START_POINT['boylam'],
        DURAK_CONFIG['enlem'],
        DURAK_CONFIG['boylam']
    )
    
    # Otobüsün durağa olan yönü
    vehicle_bearing = calculate_bearing(
        lat, lon,
        DURAK_CONFIG['enlem'],
        DURAK_CONFIG['boylam']
    )
    
    # Yön farkı (±45 derece tolerans - daha sıkı)
    bearing_diff = abs(expected_bearing - vehicle_bearing)
    if bearing_diff > 180:
        bearing_diff = 360 - bearing_diff
    
    # EK KONTROL: Otobüs START_POINT'e durağa göre daha yakın mı?
    # Eğer otobüs durağın ÖTESİNDEyse (START_POINT'e durağa göre daha uzaksa), ters yön demektir
    distance_to_start = haversine_distance(lat, lon, START_POINT['enlem'], START_POINT['boylam'])
    distance_to_durak = haversine_distance(lat, lon, DURAK_CONFIG['enlem'], DURAK_CONFIG['boylam'])
    
    # START_POINT ile DURAK arası mesafe
    start_to_durak_distance = haversine_distance(
        START_POINT['enlem'], START_POINT['boylam'],
        DURAK_CONFIG['enlem'], DURAK_CONFIG['boylam']
    )
    
    # Eğer otobüs START_POINT'e olan mesafesi, START_POINT-DURAK mesafesinden çok uzaksa, ters yönden geliyor
    # Tolerans: START_POINT'e en fazla (start_to_durak_distance + 200m) uzaklıkta olmalı
    if distance_to_start > (start_to_durak_distance + 200):
        return False  # Ters yönden geliyor
    
    return bearing_diff < 45  # 45 derece içindeyse doğru yön

def get_route_vehicles(route_code):
    """Belirli hat kodundaki araçları VTS'den çeker (SA65, SA64 vb.)"""
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
            
            # İç içe data yapısı
            if isinstance(data, dict) and 'data' in data:
                inner = data['data']
                if isinstance(inner, dict) and 'data' in inner:
                    vehicles = inner['data']
                else:
                    vehicles = inner if isinstance(inner, list) else []
            else:
                vehicles = []
            
            route_list = []
            for v in vehicles:
                if v.get('display_route_code') == route_code:
                    route_list.append({
                        'bus_id': v.get('bus_id'),
                        'plaka': v.get('car_no')
                    })
            
            return route_list
        
        print(f"Hata: Status {response.status_code}")
        return []
        
    except Exception as e:
        print(f"{route_code} araç listesi hatası: {e}")
        return []

def get_vehicle_history(bus_id, start_time, end_time):
    """Aracın geçmiş konum verilerini çeker"""
    try:
        start_str = start_time.strftime('%Y%m%d%H%M%S')
        end_str = end_time.strftime('%Y%m%d%H%M%S')
        
        url = f"{VTS_BASE_URL}/historicdevicedata/get"
        params = {
            'fields': 'date_time,lat,lon,speed,car_no,bus_id',
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
            return data
        
        return None
        
    except Exception as e:
        print(f"   Hata: {e}")
        return None

def analyze_crossings_linear(history_data, plaka):
    """
    START_POINT bazlı geçiş analizi
    
    Mantık:
    1. START_POINT'e yaklaşır (mesafe azalır)
    2. START_POINT'ten geçer (min mesafe)
    3. START_POINT'ten 500m uzaklaşırsa (lineer artış) → GEÇERLİ GEÇİŞ
    
    Bu sayede sadece START_POINT → DURAK yönünde hareket eden otobüsler tespit edilir.
    """
    
    if not history_data:
        return []
    
    # Veriyi parse et
    if isinstance(history_data, str):
        history_data = json.loads(history_data)
    
    tracks = []
    if isinstance(history_data, dict):
        inner = history_data.get('data', {})
        if isinstance(inner, dict):
            tracks = inner.get('data', [])
        elif isinstance(inner, list):
            tracks = inner
    elif isinstance(history_data, list):
        tracks = history_data
    
    if not tracks:
        print(f"   Veri yok")
        return [], {'min_dist': None, 'max_dist': None, 'leaving_triggered': False, 'leaving_start_dist': None}
    
    print(f"   {len(tracks)} nokta analiz ediliyor...")
    
    gecisler = []
    
    # YENİ MANTIK: YÖN BAZLI TESPİT
    # START_POINT -> KONTROL_NOKTASI yönünde hareket eden araçları tespit et
    
    previous_lat = None
    previous_lon = None
    previous_distance_to_start = None
    
    is_moving_to_control = False  # START_POINT'ten KONTROL_NOKTASI'na doğru mu gidiyor?
    movement_start_time = None
    movement_start_distance = None
    total_distance_moved = 0  # START_POINT'ten ne kadar uzaklaştı
    
    # Debug tracking
    min_distance_to_start = float('inf')
    max_distance_to_start = 0
    leaving_ever_triggered = False
    debug_leaving_start_distance = None
    
    for point in tracks:
        lat = point.get('lat')
        lon = point.get('lon')
        time_str = point.get('date_time')
        
        if not lat or not lon or lat == 0 or lon == 0:
            continue
        
        # START_POINT'e olan mesafe
        distance_to_start = haversine_distance(
            START_POINT['enlem'],
            START_POINT['boylam'],
            lat, lon
        )
        
        # KONTROL_NOKTASI'na olan mesafe
        distance_to_control = haversine_distance(
            KONTROL_NOKTASI['enlem'],
            KONTROL_NOKTASI['boylam'],
            lat, lon
        )
        
        # Debug: Track min/max distances
        if distance_to_start < min_distance_to_start:
            min_distance_to_start = distance_to_start
        if distance_to_start > max_distance_to_start:
            max_distance_to_start = distance_to_start
        
        # İlk nokta - referans olarak sakla
        if previous_lat is None or previous_lon is None:
            previous_lat = lat
            previous_lon = lon
            previous_distance_to_start = distance_to_start
            continue
        
        # Önceki noktadan bu noktaya hareket mesafesi
        movement_distance = haversine_distance(previous_lat, previous_lon, lat, lon)
        
        # START_POINT'e yakınlık kontrolü (400m içinde mi?)
        if distance_to_start < 400:
            # YÖN KONTROLÜ: START_POINT -> KONTROL_NOKTASI yönünde mi?
            # Önceki nokta START_POINT'e daha yakınsa VE şimdi KONTROL_NOKTASI'na yaklaşıyorsa
            previous_distance_to_control = haversine_distance(
                KONTROL_NOKTASI['enlem'],
                KONTROL_NOKTASI['boylam'],
                previous_lat, previous_lon
            )
            
            # Doğru yön: START_POINT'ten uzaklaşıyor VE KONTROL_NOKTASI'na yaklaşıyor
            moving_away_from_start = distance_to_start > previous_distance_to_start
            moving_toward_control = distance_to_control < previous_distance_to_control
            
            if moving_away_from_start and moving_toward_control and movement_distance > 5:
                if not is_moving_to_control:
                    # DURAK'a yakınlık kontrolü - BAŞLANGIÇTA kontrol et
                    distance_to_durak = haversine_distance(
                        DURAK_CONFIG['enlem'],
                        DURAK_CONFIG['boylam'],
                        previous_lat, previous_lon
                    )
                    
                    # DURAK'a 400m içinde mi? (START_POINT yakınında olmalı)
                    if distance_to_durak < 400:
                        # Hareket başladı!
                        is_moving_to_control = True
                        movement_start_time = time_str
                        movement_start_distance = previous_distance_to_start
                        total_distance_moved = 0
                        
                        # Debug tracking
                        leaving_ever_triggered = True
                        debug_leaving_start_distance = movement_start_distance
                
                # Hareket devam ediyor
                if is_moving_to_control:
                    total_distance_moved += movement_distance
                    
                    # 200m KONTROL: KONTROL_NOKTASI yönünde 200m hareket etti mi?
                    if total_distance_moved >= 200:
                        # GEÇİŞ TESPİT EDİLDİ!
                        if movement_start_time and len(movement_start_time) >= 14:
                            gecis_time = datetime.strptime(movement_start_time[:14], '%Y%m%d%H%M%S')
                            
                            # Final position (after 200m movement)
                            final_distance_from_durak = haversine_distance(
                                DURAK_CONFIG['enlem'],
                                DURAK_CONFIG['boylam'],
                                lat, lon
                            )
                            
                            gecis = {
                                'plaka': plaka,
                                'durak_adi': DURAK_CONFIG['adi'],
                                'gecis_zamani': gecis_time,
                                'min_mesafe': round(movement_start_distance, 1),
                                'cikis_mesafe': round(total_distance_moved, 1)
                            }
                            
                            gecisler.append(gecis)
                            print(f"      OK {gecis_time.strftime('%H:%M:%S')} - StartDist: {movement_start_distance:.1f}m, Moved: {total_distance_moved:.1f}m, FinalDist: {final_distance_from_durak:.1f}m")
                        
                        # Reset için hareket durduğunda
                        is_moving_to_control = False
                        movement_start_time = None
                        movement_start_distance = None
                        total_distance_moved = 0
            else:
                # Ters yön veya duruş - reset
                if is_moving_to_control:
                    is_moving_to_control = False
                    movement_start_time = None
                    movement_start_distance = None
                    total_distance_moved = 0
        else:
            # 400m'den uzakta - reset
            if is_moving_to_control:
                is_moving_to_control = False
                movement_start_time = None
                movement_start_distance = None
                total_distance_moved = 0
        
        # Bir sonraki iterasyon için güncelle
        previous_lat = lat
        previous_lon = lon
        previous_distance_to_start = distance_to_start
    
    # Return crossings and debug info
    debug_info = {
        'min_dist': min_distance_to_start if min_distance_to_start != float('inf') else 0,
        'max_dist': max_distance_to_start,
        'leaving_triggered': leaving_ever_triggered,
        'leaving_start_dist': debug_leaving_start_distance
    }
    
    return gecisler, debug_info

def main():
    print("="*70)
    print("VTS GECMIS VERI ANALIZI V2 - LINEER ARTIS MANTIGI")
    print("="*70 + "\n")
    
    # Bugün
    bugun = datetime.now().date()
    baslangic = datetime.combine(bugun, datetime.strptime("06:00:00", "%H:%M:%S").time())
    bitis = datetime.now()
    
    print(f"Tarih: {bugun.strftime('%d.%m.%Y')}")
    print(f"Saat: {baslangic.strftime('%H:%M')} - {bitis.strftime('%H:%M')}")
    print(f"Durak: {DURAK_CONFIG['adi']}")
    print(f"Koordinat: {DURAK_CONFIG['enlem']}, {DURAK_CONFIG['boylam']}")
    print("-"*70)
    
    # Tüm hatları analiz et
    all_results = []
    
    routes = ['SA65', 'SA64', '400', '521C', 'KC06', 'KF52', 'KL08', 'KL08G', 'KM61', 'SD20', 'SD20A', 'SM62', 'UC32', 'VS18']
    
    for route_code in routes:
        print(f"\n{'='*70}")
        print(f"{route_code} HATTI ANALIZ EDILIYOR")
        print("="*70)
        
        print(f"\n{route_code} araclari getiriliyor...")
        vehicles = get_route_vehicles(route_code)
        
        if not vehicles:
            print(f"❌ HATA: {route_code} araci bulunamadi!")
            continue
        
        print(f"✅ Bulunan {route_code} araclari: {len(vehicles)}\n")
        for v in vehicles:
            print(f"  - {v['plaka']} (bus_id: {v['bus_id']})")
        
        print("\n" + "-" * 70)
        print(f"🔍 Araç tarihçeleri çekiliyor ve geçişler analiz ediliyor...\n")
        
        tum_gecisler = []
    
        # Her araç için analiz
        for vehicle in vehicles:
            plaka = vehicle['plaka']
            bus_id = vehicle['bus_id']
            
            print(f"\n🚌 {plaka} (Bus ID: {bus_id})")
            print(f"   📡 VTS API'den tarihçe çekiliyor...")
            
            history = get_vehicle_history(bus_id, baslangic, bitis)
            
            if history:
                print(f"   ✅ {len(history)} konum verisi alındı")
                print(f"   🔍 Geçişler analiz ediliyor...")
                gecisler, debug_info = analyze_crossings_linear(history, plaka)
                tum_gecisler.extend(gecisler)
                if len(gecisler) > 0:
                    print(f"   ✅ {len(gecisler)} geçiş tespit edildi")
                else:
                    # Debug output for problematic routes
                    if route_code in ['400', '521C', 'KL08', 'KL08G', 'SD20', 'SD20A', 'VS18']:
                        if debug_info['min_dist'] is not None and debug_info['max_dist'] is not None:
                            leaving_dist_str = f"{debug_info['leaving_start_dist']:.1f}" if debug_info['leaving_start_dist'] is not None else "None"
                            print(f"   🐛 DEBUG: min_dist={debug_info['min_dist']:.1f}m, max_dist={debug_info['max_dist']:.1f}m, leaving_triggered={debug_info['leaving_triggered']}, leaving_start_dist={leaving_dist_str}m")
                        else:
                            print(f"   🐛 DEBUG: No GPS data available")
                    print(f"   ⚠️  Geçiş tespit edilemedi")
            else:
                print(f"   ❌ VTS verisi alınamadı")
        
        # Sonuçlar
        print("\n" + "="*70)
        print(f"{route_code} TOPLAM: {len(tum_gecisler)} GECIS TESPIT EDILDI")
        print("="*70 + "\n")
        
        if tum_gecisler:
            # Plakaya göre grupla
            from collections import defaultdict
            plaka_gecisleri = defaultdict(list)
            
            for g in tum_gecisler:
                plaka_gecisleri[g['plaka']].append(g)
            
            for plaka in sorted(plaka_gecisleri.keys()):
                gecisler = plaka_gecisleri[plaka]
                print(f"{plaka}: {len(gecisler)} gecis")
                for g in sorted(gecisler, key=lambda x: x['gecis_zamani']):
                    print(f"  {g['gecis_zamani'].strftime('%H:%M:%S')} - Min mesafe: {g['min_mesafe']}m")
            
            all_results.append((tum_gecisler, route_code))
    
    print("\n" + "="*70)
    
    # Database'e kaydet (approve-row API kullanarak - popup ile aynı mantık)
    if all_results:
        print("\nDATABASE GUNCELLENIYOR...")
        
        try:
            import requests
            
            toplam_guncellenen = 0
            
            for tum_gecisler, route_code in all_results:
                print(f"\n{'='*70}")
                print(f"💾 {route_code} için database güncelleniyor...")
                print(f"{'='*70}")
                
                print(f"\n📡 Tarife bilgileri çekiliyor (API: get-table-data)...")
                # Tarife bilgilerini al (Kalkış satırları)
                db_response = requests.post(
                    'https://bus-control-4i5o.vercel.app/api/get-table-data',
                    json={'tableName': route_code, 'hareket': 'Kalkış'},
                    timeout=30
                )
                
                db_result = db_response.json()
                
                if not db_result.get('success'):
                    print(f"❌ {route_code} tablo verisi alınamadı: {db_result.get('error')}")
                    continue
                
                tarife_rows = db_result.get('data', [])
                print(f"✅ {len(tarife_rows)} Kalkış satırı alındı\n")
                print(f"🔄 {len(tum_gecisler)} VTS geçişi ile eşleştiriliyor...\n")
                
                guncellenen = 0
                
                # Zaman parse fonksiyonu
                def time_to_minutes(t):
                    if isinstance(t, str):
                        h, m = map(int, t.split(':')[:2])
                    else:
                        h, m = t.hour, t.minute
                    return h * 60 + m
                
                # ADIM 1: Geçişleri plaka ve tarife bazında grupla
                # Aynı plaka için aynı tarifeye yakın geçişler varsa, EN ERKEN olanı al
                gecis_grouped = {}  # Key: (plaka, tarife_saati), Value: list of geçişler
                
                for gecis in tum_gecisler:
                    plaka = gecis['plaka']
                    gecis_mins = time_to_minutes(gecis['gecis_zamani'])
                    
                    # Bu geçişe uygun tarife bul
                    for row in tarife_rows:
                        if row.get('Plaka') != plaka:
                            continue
                        
                        tarife_saati = row.get('Tarife_Saati')
                        if not tarife_saati:
                            continue
                        
                        tarife_mins = time_to_minutes(tarife_saati)
                        fark = abs(tarife_mins - gecis_mins)
                        
                        if fark <= 30:  # ±30 dakika içinde
                            key = (plaka, tarife_saati)
                            if key not in gecis_grouped:
                                gecis_grouped[key] = []
                            gecis_grouped[key].append({
                                'gecis': gecis,
                                'tarife_row': row,
                                'fark': fark
                            })
                            break  # Bu geçiş için ilk uygun tarife bulundu
                
                # ADIM 2: Her grup için EN ERKEN geçişi seç (500m+ lineer artış sonrası ilk geçiş)
                filtered_gecisler = []
                
                for key, matches in gecis_grouped.items():
                    if len(matches) > 1:
                        # Birden fazla geçiş var, EN ERKEN olanı al
                        matches_sorted = sorted(matches, key=lambda x: x['gecis']['gecis_zamani'])
                        selected = matches_sorted[0]
                        print(f"\n⚠️  {key[0]} - Tarife {key[1]}: {len(matches)} geçiş bulundu, EN ERKEN seçildi:")
                        for m in matches_sorted:
                            marker = "✅ SEÇİLDİ" if m == selected else "❌ ATLANDI"
                            print(f"   {marker} {m['gecis']['gecis_zamani'].strftime('%H:%M:%S')} (Fark: {m['fark']} dk)")
                        filtered_gecisler.append(selected)
                    else:
                        # Tek geçiş var, direkt al
                        filtered_gecisler.append(matches[0])
                
                # ADIM 3: Filtrelenmiş geçişleri işle
                for idx, item in enumerate(filtered_gecisler, 1):
                    gecis = item['gecis']
                    best_match = item['tarife_row']
                    best_diff = item['fark']
                    
                    plaka = gecis['plaka']
                    gecis_zamani = gecis['gecis_zamani'].strftime('%H:%M:%S')
                    
                    print(f"\n[{idx}/{len(filtered_gecisler)}] {plaka} - {gecis_zamani}")
                    print(f"   🔍 Tarife satırlarında eşleşme aranıyor...")
                    print(f"   🔍 Tarife satırlarında eşleşme aranıyor...")
                    
                    if best_match:
                        print(f"   ✅ Eşleşme bulundu: Tarife {best_match.get('Tarife_Saati')} (Fark: {best_diff} dk)")
                        # approve-row API ile güncelle (VTS geçiş zamanını kullan)
                        print(f"   📡 Database güncelleniyor (API: approve-row)...")
                        try:
                            update_response = requests.post(
                                'https://bus-control-4i5o.vercel.app/api/approve-row',
                                json={
                                    'tableName': route_code,
                                    'hatAdi': best_match.get('Hat_Adi'),
                                    'calismaZamani': best_match.get('Çalışma_Zamanı'),
                                    'tarife': best_match.get('Tarife'),
                                    'tarifeSaati': best_match.get('Tarife_Saati'),
                                    'hareket': 'Kalkış',
                                    'manualApprovalTime': gecis_zamani  # VTS geçiş zamanı (önemli!)
                                },
                                timeout=10
                            )
                            
                            update_result = update_response.json()
                            
                            if update_response.status_code == 200 and update_result.get('success'):
                                guncellenen += 1
                                print(f"   ✅ BAŞARILI: {plaka} - Tarife {best_match.get('Tarife_Saati')} → Onaylanan {gecis_zamani}")
                            else:
                                print(f"   ❌ API HATASI: {update_result.get('error', 'Bilinmeyen hata')}")
                        except Exception as e:
                            print(f"   ❌ İSTEK HATASI: {e}")
                    else:
                        print(f"   ⚠️  Eşleşme bulunamadı (±30 dk içinde uygun tarife yok)")
                
                print(f"\n{'='*70}")
                print(f"✅ {route_code} TAMAMLANDI: {guncellenen}/{len(tum_gecisler)} geçiş güncellendi")
                print(f"{'='*70}")
                toplam_guncellenen += guncellenen
            
            print(f"\n{'='*70}")
            print(f"✅ İŞLEM TAMAMLANDI!")
            print(f"{'='*70}")
            print(f"📊 TOPLAM: {toplam_guncellenen} satır VTS geçiş zamanı ile güncellendi!")
            print(f"🔄 Vercel'deki tabloları yenileyin ve 'Onaylanan' sütununu kontrol edin.")
            print(f"{'='*70}")
            
        except Exception as e:
            print(f"\n❌ API hatası: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*70)


if __name__ == '__main__':
    main()
