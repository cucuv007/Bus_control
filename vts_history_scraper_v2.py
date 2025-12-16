#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VTS History Scraper V2
Gelişmiş Geçiş Tespit Mantığı:
- Durağa yaklaşma: Mesafe azalır
- Duraktan uzaklaşma: Mesafe artar
- Geçiş: Uzaklaşırken 100m'yi geçtiğinde sayılır (lineer artış)
"""

import requests
import json
from datetime import datetime

# VTS API
VTS_BASE_URL = "https://vts.kentkart.com.tr/api/026/v1"

# Cookie'lerinizi buraya güncelleyin
VTS_COOKIES = {
    'access_token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjM1MTIsImF1ZCI6IjMiLCJleHAiOjE3NjU5NTA2NTQsIm5iZiI6MTc2NTc3Nzg1NCwiaWF0IjoxNzY1Nzc3ODU0LCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRrIiwiYjNBNFZUUyJdLCJleHQiOm51bGwsImlzU3VwZXJBZG1pbiI6MCwiaXAiOiIxMC4wLjQwLjgiLCJsb2dpbm1ldGhvZCI6bnVsbCwiYWNjcm9sZSI6bnVsbCwicm9sZSI6WyJ2dHNhZG1pbiJdLCJuZXRzIjpbeyJOSUQiOiIwMjYiLCJEIjoiMSIsIk5BTUUiOiJBTlRBTFlBIn1dLCJsYW5nIjoidHIiLCJ1c2VybmFtZSI6InVndXIueWlsbWF6Iiwic2lkIjo1MTEwNTgyfQ.Z37r5Lssp5Lbed8zf4QY3-Eccj8F0Ydg9rnTHfd7386p3AROgOAaj1VgAT9n-Zhi3TWWtVyWAS2HbA_xVgCB07HmHJ-o_MxrBQslEXRk-vaEJaefF0XtcqQwuZtTShevMFO8TdtkObAZPbYhdZ4a-t3GeIKxSVO25u0rzlaOuAAU5qCF4qFz1Hteqs5rkesdgpHkVYzqrG448Mo7PwpsLhj-pM0Fv81jptVEnYurkWFCenlJtUOHDO89GlhBwLKAGOIuseybkqm1QunsHzUVduaNAyzxioZauv25qinUY_5WA-MVVn2l5K9adqj42RWMSoPmecXV-3b7C9ohRnaq5A',
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

# Durak koordinatları
DURAK_CONFIG = {
    'adi': 'Sarısu Depolama Merkezi-1',
    'enlem': 36.830802,
    'boylam': 30.596277
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

def get_sa65_vehicles():
    """SA65 araçlarını VTS'den çeker"""
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
            
            sa65_list = []
            for v in vehicles:
                if v.get('display_route_code') == 'SA65':
                    sa65_list.append({
                        'bus_id': v.get('bus_id'),
                        'plaka': v.get('car_no')
                    })
            
            return sa65_list
        
        print(f"Hata: Status {response.status_code}")
        return []
        
    except Exception as e:
        print(f"SA65 araç listesi hatası: {e}")
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
    Gelişmiş geçiş analizi - Lineer artış kontrolü
    
    Mantık:
    1. Her noktada durağa olan mesafeyi hesapla
    2. Önceki mesafe ile karşılaştır:
       - Mesafe azalıyorsa: Durağa yaklaşıyor
       - Mesafe artıyorsa: Duraktan uzaklaşıyor
    3. Geçiş: Uzaklaşma fazında 100m'yi geçtiğinde
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
        return []
    
    print(f"   {len(tracks)} nokta analiz ediliyor...")
    
    gecisler = []
    
    # Durum takibi
    previous_distance = None
    min_distance = None  # Durağa en yakın mesafe
    min_distance_time = None
    is_approaching = False  # Durağa yaklaşıyor mu?
    is_leaving = False  # Duraktan uzaklaşıyor mu?
    crossed_100m = False  # 100m'yi geçti mi?
    
    for point in tracks:
        lat = point.get('lat')
        lon = point.get('lon')
        time_str = point.get('date_time')
        
        if not lat or not lon or lat == 0 or lon == 0:
            continue
        
        # Durağa olan mesafe
        distance = haversine_distance(
            DURAK_CONFIG['enlem'],
            DURAK_CONFIG['boylam'],
            lat, lon
        )
        
        # İlk nokta
        if previous_distance is None:
            previous_distance = distance
            if distance < 200:  # 200m içindeyse takibe başla
                min_distance = distance
                min_distance_time = time_str
            continue
        
        # Mesafe değişimi
        distance_change = distance - previous_distance
        
        # YAKLAȘMA FAZI: Mesafe azalıyor
        if distance_change < -5:  # 5m'den fazla azalma
            if not is_approaching:
                is_approaching = True
                is_leaving = False
                crossed_100m = False
            
            # En yakın noktayı kaydet
            if min_distance is None or distance < min_distance:
                min_distance = distance
                min_distance_time = time_str
        
        # UZAKLAŞMA FAZI: Mesafe artıyor
        elif distance_change > 5:  # 5m'den fazla artma
            if not is_leaving:
                # Yaklaşma fazından uzaklaşma fazına geçiş
                if is_approaching and min_distance is not None:
                    is_leaving = True
                    is_approaching = False
            
            # Uzaklaşırken 500m'yi geçti mi?
            if is_leaving and min_distance is not None:
                if not crossed_100m and distance > 500 and min_distance < 500:
                    # GEÇİŞ TESPİT EDİLDİ!
                    crossed_100m = True
                    
                    # Geçiş zamanı = En yakın olduğu an
                    if min_distance_time and len(min_distance_time) >= 14:
                        gecis_time = datetime.strptime(min_distance_time[:14], '%Y%m%d%H%M%S')
                        
                        gecis = {
                            'plaka': plaka,
                            'durak_adi': DURAK_CONFIG['adi'],
                            'gecis_zamani': gecis_time,
                            'min_mesafe': round(min_distance, 1),
                            'cikis_mesafe': round(distance, 1)
                        }
                        
                        gecisler.append(gecis)
                        print(f"      ✓ {gecis_time.strftime('%H:%M:%S')} - Min: {min_distance:.1f}m, Çıkış: {distance:.1f}m")
                    
                    # Reset
                    min_distance = None
                    min_distance_time = None
                    is_leaving = False
        
        # Mesafe sabit (durmuş olabilir)
        else:
            pass  # Durum değişmez
        
        previous_distance = distance
    
    return gecisler

def main():
    print("\n" + "="*70)
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
    print("-" * 70)
    
    # SA65 araçlarını al
    print("\nSA65 araclari getiriliyor...")
    vehicles = get_sa65_vehicles()
    
    if not vehicles:
        print("HATA: SA65 araci bulunamadi!")
        print("\nLutfen:")
        print("1. VTS'ye giris yapin: https://vts.kentkart.com.tr")
        print("2. F12 -> Application -> Cookies")
        print("3. 'access_token' degerini kopyalayip bu dosyada guncelleyin")
        return
    
    print(f"Bulunan SA65 araclari: {len(vehicles)}\n")
    for v in vehicles:
        print(f"  - {v['plaka']} (bus_id: {v['bus_id']})")
    
    print("\n" + "-" * 70)
    
    tum_gecisler = []
    
    # Her araç için analiz
    for vehicle in vehicles:
        plaka = vehicle['plaka']
        bus_id = vehicle['bus_id']
        
        print(f"\n{plaka} analiz ediliyor...")
        
        history = get_vehicle_history(bus_id, baslangic, bitis)
        
        if history:
            gecisler = analyze_crossings_linear(history, plaka)
            tum_gecisler.extend(gecisler)
            print(f"   Tespit edilen gecis: {len(gecisler)}")
        else:
            print(f"   Veri alinamadi")
    
    # Sonuçlar
    print("\n" + "="*70)
    print(f"TOPLAM {len(tum_gecisler)} GECIS TESPIT EDILDI")
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
    
    print("\n" + "="*70)
    
    # Database'e kaydet (approve-row API kullanarak - popup ile aynı mantık)
    if tum_gecisler:
        print("\nDATABASE GUNCELLENIYOR...")
        
        try:
            import requests
            
            # SA65 tarife bilgilerini al (Kalkış satırları)
            db_response = requests.post(
                'https://bus-control-4i5o.vercel.app/api/get-table-data',
                json={'tableName': 'SA65', 'hareket': 'Kalkış'},
                timeout=30
            )
            
            db_result = db_response.json()
            
            if not db_result.get('success'):
                print(f"\n❌ Tablo verisi alınamadı: {db_result.get('error')}")
                return
            
            tarife_rows = db_result.get('data', [])
            print(f"📋 {len(tarife_rows)} Kalkış satırı alındı")
            
            guncellenen = 0
            
            # Her geçişi tarife ile eşleştir
            for gecis in tum_gecisler:
                plaka = gecis['plaka']
                gecis_zamani = gecis['gecis_zamani'].strftime('%H:%M:%S')
                
                # Zaman parse
                def time_to_minutes(t):
                    if isinstance(t, str):
                        h, m = map(int, t.split(':')[:2])
                    else:
                        h, m = t.hour, t.minute
                    return h * 60 + m
                
                gecis_mins = time_to_minutes(gecis['gecis_zamani'])
                
                # En yakın tarife satırını bul (±30 dakika)
                best_match = None
                best_diff = 9999
                
                for row in tarife_rows:
                    # Plaka eşleşmesi
                    if row.get('Plaka') != plaka:
                        continue
                    
                    # Zaten dolu mu?
                    if row.get('Onaylanan'):
                        continue
                    
                    tarife_saati = row.get('Tarife_Saati')
                    if not tarife_saati:
                        continue
                    
                    tarife_mins = time_to_minutes(tarife_saati)
                    fark = abs(tarife_mins - gecis_mins)
                    
                    if fark <= 30 and fark < best_diff:
                        best_diff = fark
                        best_match = row
                
                if best_match:
                    # approve-row API ile güncelle (popup ile aynı)
                    update_response = requests.post(
                        'https://bus-control-4i5o.vercel.app/api/approve-row',
                        json={
                            'tableName': 'SA65',
                            'hatAdi': best_match.get('Hat_Adi'),
                            'calismaZamani': best_match.get('Çalışma_Zamanı'),
                            'tarife': best_match.get('Tarife'),
                            'tarifeSaati': best_match.get('Tarife_Saati'),
                            'hareket': 'Kalkış',
                            'manualApprovalTime': gecis_zamani  # VTS zamanı
                        },
                        timeout=10
                    )
                    
                    # Manuel approval time için API'yi güncelle
                    # Şimdilik standard approval kullan
                    guncellenen += 1
                    print(f"  ✓ {plaka} - {best_match.get('Tarife_Saati')} → {gecis_zamani}")
            
            print(f"\n✅ {guncellenen} satır güncellendi!")
            print(f"ℹ️  Not: Güncelleme mevcut saat ile yapıldı. VTS zamanını kullanmak için tabloyu elle onaylayın.")
            
        except Exception as e:
            print(f"\n❌ API hatası: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*70)


if __name__ == '__main__':
    main()
