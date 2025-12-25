#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VTS Geçmiş Veri API Test Script
Bugün sabah 06:30'dan itibaren SA65 araçlarının konum geçmişini çeker
"""

import requests
from datetime import datetime, timedelta
import json

# VTS API yapılandırması
VTS_BASE_URL = "https://vts.kentkart.com.tr/api/026/v1"

# Cookie'leriniz (vts_realtime_pusher.py'den kopyalayın)
VTS_COOKIES = {
    'access_token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjM1MTIsImF1ZCI6IjMiLCJleHAiOjE3NjU2MTU0MTAsIm5iZiI6MTc2NTQ0MjYxMCwiaWF0IjoxNzY1NDQyNjEwLCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRrIiwiYjNBNFZUUyJdLCJleHQiOm51bGwsImlzU3VwZXJBZG1pbiI6MCwiaXAiOiIxMC4wLjQwLjgiLCJsb2dpbm1ldGhvZCI6bnVsbCwiYWNjcm9sZSI6bnVsbCwicm9sZSI6WyJ2dHNhZG1pbiJdLCJuZXRzIjpbeyJOSUQiOiIwMjYiLCJEIjoiMSIsIk5BTUUiOiJBTlRBTFlBIn1dLCJsYW5nIjoidHIiLCJ1c2VybmFtZSI6InVndXIueWlsbWF6Iiwic2lkIjo1MTA2OTI5fQ.FzBBX7OHXHqiHW_m4wgvUTN6iVjLiJQmafabMwqL1xPU9HDaO78f8uF5VtmZ1ma6WoD-weDwEfqeJyyhC_bS0lTnUjwvmIOXVnd9kK8Qc8pcxLlrAVm4_8_B-7ReRigwtn5e1abU1HESgKWIQzPr1_cw9qEWqPPDK6cm6c9T27Wg_5Zc_YQac68hFS-5-VsEigK72xva9CctrKzMlnVO4UN536PlTLv8wnjeefCwr6EB47Ri4_BImoqJlqgKTJyNe3RAmVCXb3Px-c6kKCJtWwgRj3GqwbzRGGeXJv6z1j1OXPzfF2EeJjAtEP7BwXJMzdJW8DIr0zZkRc41h1qiBA',
    'network_id': '026',
    'iframe': '1',
    'SERVERIDVTS': 'vts13'
}

# Geofence yapılandırması
DURAK_CONFIG = {
    'adi': 'Sarısu Depolama Merkezi-1',
    'enlem': 36.830802,
    'boylam': 30.596277,
    'min_enlem': 36.829802,  # -0.001
    'max_enlem': 36.831802,  # +0.001
    'min_boylam': 30.595277,  # -0.001
    'max_boylam': 30.597277   # +0.001
}

def test_historical_endpoints():
    """VTS'de geçmiş veri endpoint'lerini test et"""
    
    headers = {
        'Authorization': f'Bearer {VTS_COOKIES["access_token"]}',
        'Content-Type': 'application/json'
    }
    
    # Bugünün tarihleri
    bugun = datetime.now().date()
    baslangic = datetime.combine(bugun, datetime.strptime("06:30:00", "%H:%M:%S").time())
    bitis = datetime.now()
    
    print(f"🔍 VTS Geçmiş Veri API Test")
    print(f"📅 Tarih Aralığı: {baslangic} - {bitis}")
    print("-" * 60)
    
    # Deneme 1: Device History endpoint
    endpoint1 = f"{VTS_BASE_URL}/devicehistory/get"
    print(f"\n1️⃣ Test ediliyor: {endpoint1}")
    
    payload1 = {
        "start_date": baslangic.isoformat(),
        "end_date": bitis.isoformat(),
        "device_ids": [],  # Tüm SA65 araçları
        "route_code": "SA65"
    }
    
    try:
        response = requests.post(endpoint1, json=payload1, headers=headers, cookies=VTS_COOKIES, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı! Veri alındı:")
            print(f"   {json.dumps(data, indent=2)[:500]}...")
    except Exception as e:
        print(f"   ❌ Hata: {e}")
    
    # Deneme 2: Route History endpoint
    endpoint2 = f"{VTS_BASE_URL}/routehistory/get"
    print(f"\n2️⃣ Test ediliyor: {endpoint2}")
    
    payload2 = {
        "date": bugun.isoformat(),
        "route_code": "SA65"
    }
    
    try:
        response = requests.post(endpoint2, json=payload2, headers=headers, cookies=VTS_COOKIES, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı! Veri alındı:")
            print(f"   {json.dumps(data, indent=2)[:500]}...")
    except Exception as e:
        print(f"   ❌ Hata: {e}")
    
    # Deneme 3: Track History endpoint
    endpoint3 = f"{VTS_BASE_URL}/track/history"
    print(f"\n3️⃣ Test ediliyor: {endpoint3}")
    
    payload3 = {
        "start_time": baslangic.isoformat(),
        "end_time": bitis.isoformat(),
        "filters": [
            {"key": "display_route_code", "value": "SA65"}
        ]
    }
    
    try:
        response = requests.post(endpoint3, json=payload3, headers=headers, cookies=VTS_COOKIES, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı! Veri alındı:")
            print(f"   {json.dumps(data, indent=2)[:500]}...")
    except Exception as e:
        print(f"   ❌ Hata: {e}")
    
    # Deneme 4: GET parametreleriyle
    endpoint4 = f"{VTS_BASE_URL}/latestdevicedata/history"
    print(f"\n4️⃣ Test ediliyor: {endpoint4}")
    
    params = {
        "start_date": baslangic.isoformat(),
        "end_date": bitis.isoformat(),
        "route_code": "SA65"
    }
    
    try:
        response = requests.get(endpoint4, params=params, headers=headers, cookies=VTS_COOKIES, timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Başarılı! Veri alındı:")
            print(f"   {json.dumps(data, indent=2)[:500]}...")
    except Exception as e:
        print(f"   ❌ Hata: {e}")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("VTS GEÇMİŞ VERİ API TESTİ")
    print("="*60 + "\n")
    
    test_historical_endpoints()
    
    print("\n" + "="*60)
