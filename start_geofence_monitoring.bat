@echo off
REM SA65 Durak Geofence Monitoring - Otomatik Başlatma
REM Sabah 06:30'da bu script Windows Task Scheduler tarafından çalıştırılacak

cd /d "C:\Users\utkuesin.kurucu\Desktop\BusControl_Düzenli"

REM Python pusher'ı başlat
python vts_realtime_pusher.py

pause
