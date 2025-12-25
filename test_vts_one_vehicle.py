# -*- coding: utf-8 -*-
import requests
import json
from datetime import datetime

bus_id = '71447'  # 07AAU919
start = '20251211060000'
end = '20251211165500'

url = 'https://vts.kentkart.com.tr/api/026/v1/historicdevicedata/get'
cookies = {
    'access_token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjM1MTIsImF1ZCI6IjMiLCJleHAiOjE3NjU2MTU0MTAsIm5iZiI6MTc2NTQ0MjYxMCwiaWF0IjoxNzY1NDQyNjEwLCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRrIiwiYjNBNFZUUyJdLCJleHQiOm51bGwsImlzU3VwZXJBZG1pbiI6MCwiaXAiOiIxMC4wLjQwLjgiLCJsb2dpbm1ldGhvZCI6bnVsbCwiYWNjcm9sZSI6bnVsbCwicm9sZSI6WyJ2dHNhZG1pbiJdLCJuZXRzIjpbeyJOSUQiOiIwMjYiLCJEIjoiMSIsIk5BTUUiOiJBTlRBTFlBIn1dLCJsYW5nIjoidHIiLCJ1c2VybmFtZSI6InVndXIueWlsbWF6Iiwic2lkIjo1MTA2OTI5fQ.FzBBX7OHXHqiHW_m4wgvUTN6iVjLiJQmafabMwqL1xPU9HDaO78f8uF5VtmZ1ma6WoD-weDwEfqeJyyhC_bS0lTnUjwvmIOXVnd9kK8Qc8pcxLlrAVm4_8_B-7ReRigwtn5e1abU1HESgKWIQzPr1_cw9qEWqPPDK6cm6c9T27Wg_5Zc_YQac68hFS-5-VsEigK72xva9CctrKzMlnVO4UN536PlTLv8wnjeefCwr6EB47Ri4_BImoqJlqgKTJyNe3RAmVCXb3Px-c6kKCJtWwgRj3GqwbzRGGeXJv6z1j1OXPzfF2EeJjAtEP7BwXJMzdJW8DIr0zZkRc41h1qiBA',
    'network_id': '026'
}
headers = {
    'Authorization': f'Bearer {cookies["access_token"]}'
}
params = {
    'fields': 'date_time,lat,lon,speed,car_no',
    'bus_list': bus_id,
    'start_date_time': start,
    'end_date_time': end,
    'sort': 'date_time|asc',
    'dc': int(datetime.now().timestamp() * 1000)
}

print(f"Fetching history for bus_id={bus_id}")
print(f"Time range: {start} - {end}\n")

r = requests.get(url, params=params, headers=headers, cookies=cookies, timeout=30)

print(f"Status: {r.status_code}")
print(f"Response length: {len(r.text)} bytes\n")

if r.status_code == 200:
    data = r.json()
    print(f"Data type: {type(data)}")
    print(f"Data keys: {data.keys() if isinstance(data, dict) else 'N/A'}")
    
    if isinstance(data, dict) and 'data' in data:
        points = data['data']
        print(f"\nPoints type: {type(points)}")
        print(f"\nTotal points: {len(points) if isinstance(points, (list, dict)) else 'N/A'}")
        
        if isinstance(points, dict):
            print(f"Points keys: {list(points.keys())[:10]}")
            print(f"\nFirst key sample: {list(points.keys())[0] if points else 'None'}")
            if points:
                first_key = list(points.keys())[0]
                print(f"First value: {json.dumps(points[first_key], indent=2)[:500]}")
        elif isinstance(points, list) and points:
            print(f"\nFirst point type: {type(points[0])}")
            print(f"First point: {json.dumps(points[0], indent=2)}")
            
            if len(points) > 1:
                print(f"\nLast point: {json.dumps(points[-1], indent=2)}")
    else:
        print(f"\nRaw data: {json.dumps(data, indent=2)[:500]}")
else:
    print(f"Error: {r.text[:200]}")
