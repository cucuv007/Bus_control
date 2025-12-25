#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Geofence Geçiş Raporu Oluşturucu
Bugünkü tüm geçişleri Excel dosyasına kaydeder
"""

import requests
from datetime import datetime
import json

API_URL = "https://bus-control-4i5o.vercel.app/api/vts-push-data"

def export_to_excel():
    """Geçiş verilerini Excel dosyasına kaydet"""
    
    print("🔍 Geçiş verileri alınıyor...")
    
    try:
        response = requests.get(API_URL, timeout=10)
        data = response.json()
        
        if not data or 'gecisler' not in data:
            print("❌ Veri bulunamadı!")
            return
        
        gecisler = data['gecisler']
        
        if not gecisler:
            print("⚠️  Henüz geçiş kaydı yok!")
            return
        
        print(f"✅ {len(gecisler)} geçiş kaydı bulundu")
        
        # Excel dosyası oluştur
        try:
            import pandas as pd
        except ImportError:
            print("❌ pandas kütüphanesi yüklü değil!")
            print("   Yüklemek için: pip install pandas openpyxl")
            return
        
        # DataFrame oluştur
        df_data = []
        for i, gecis in enumerate(gecisler, 1):
            gecis_zamani = datetime.fromisoformat(gecis['gecis_zamani'])
            
            df_data.append({
                'Sıra': i,
                'Plaka': gecis['plaka'],
                'Durak': gecis['durak_adi'],
                'Tarih': gecis_zamani.strftime('%d.%m.%Y'),
                'Saat': gecis_zamani.strftime('%H:%M:%S'),
                'Enlem': gecis['arac_enlem'],
                'Boylam': gecis['arac_boylam'],
                'Mesafe (m)': round(gecis['mesafe_metre'], 2),
                'Hız (km/h)': gecis.get('hiz', 0),
                'Hat': gecis.get('hat_kodu', '-'),
                'Rota': gecis.get('rota', '-'),
                'Sürücü': gecis.get('surucu', '-'),
                'Şirket': gecis.get('sirket', '-')
            })
        
        df = pd.DataFrame(df_data)
        
        # Dosya adı (bugünün tarihi)
        bugun = datetime.now().strftime('%Y-%m-%d')
        filename = f"Sarisu_Depolama_Durak_Gecisleri_{bugun}.xlsx"
        
        # Excel'e kaydet
        df.to_excel(filename, index=False, sheet_name='Geçişler')
        
        print(f"\n✅ Excel dosyası oluşturuldu: {filename}")
        print(f"📊 Toplam {len(gecisler)} geçiş kaydedildi\n")
        
        # İstatistikler
        plakalar = df['Plaka'].unique()
        print("📈 İstatistikler:")
        print(f"   - Farklı araç sayısı: {len(plakalar)}")
        for plaka in plakalar:
            count = len(df[df['Plaka'] == plaka])
            print(f"   - {plaka}: {count} geçiş")
        
        print(f"\n   - İlk geçiş: {df_data[0]['Saat']}")
        print(f"   - Son geçiş: {df_data[-1]['Saat']}")
        
    except Exception as e:
        print(f"❌ Hata: {e}")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("GEOFENCE GEÇİŞ RAPORU OLUŞTURUCU")
    print("Sarısu Depolama Merkezi-1")
    print("="*60 + "\n")
    
    export_to_excel()
    
    print("\n" + "="*60)
