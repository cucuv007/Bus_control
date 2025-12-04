"""
Basit Flask Proxy Sunucusu - Danger Tablosu için
npm olmadan çalışır, sadece Python gerekir

Kullanım:
1. Python yüklü olmalı (python --version)
2. pip install flask requests
3. python simple_server.py
4. Tarayıcıda http://localhost:5000 açın
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# Supabase Credentials
SUPABASE_URL = "https://vhxjyfappvmtwfdkhkoc.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeGp5ZmFwcHZtdHdmZGtoa29jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU0MjkyNywiZXhwIjoyMDQ4MTE4OTI3fQ.VWnKC7B_5oqKhthYCVzMoHuSUxYmH9O6A3xjcwwm7NQ"

@app.route('/')
def index():
    return send_from_directory('public', 'code.html')

@app.route('/api/get-danger-times', methods=['GET'])
def get_danger_times():
    """Danger tablosundan tüm zamanları getir"""
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/Danger?select=Name,Uyarı",
            headers={
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}'
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            # Convert to map
            danger_map = {}
            for row in data:
                danger_map[row['Name']] = row['Uyarı']
            
            return jsonify({
                'success': True,
                'data': danger_map
            })
        else:
            return jsonify({
                'success': False,
                'error': f'HTTP {response.status_code}'
            }), response.status_code
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/update-danger-time', methods=['POST'])
def update_danger_time():
    """Danger tablosunda zamanları güncelle"""
    try:
        data = request.json
        hat_names = data.get('hatNames', [])
        uyari_time = data.get('uyariTime', '')
        
        if not hat_names or not uyari_time:
            return jsonify({
                'success': False,
                'error': 'hatNames ve uyariTime gerekli'
            }), 400
        
        # HH:MM to HH:MM:SS
        time_with_seconds = f"{uyari_time}:00"
        
        success_count = 0
        for hat_name in hat_names:
            response = requests.patch(
                f"{SUPABASE_URL}/rest/v1/Danger?Name=eq.{hat_name}",
                headers={
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                json={'Uyarı': time_with_seconds}
            )
            
            if response.status_code in [200, 204]:
                success_count += 1
        
        return jsonify({
            'success': True,
            'message': f'{success_count} hat güncellendi',
            'updatedHats': hat_names
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Flask Sunucusu Başlatılıyor...")
    print("=" * 60)
    print("📍 URL: http://localhost:5000")
    print("📁 Static: public/code.html")
    print("🔌 API Endpoints:")
    print("   - GET  /api/get-danger-times")
    print("   - POST /api/update-danger-time")
    print("=" * 60)
    print("⚠️  Durdurmak için: Ctrl+C")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
