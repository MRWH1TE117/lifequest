@echo off
setlocal

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Nie znaleziono npm. Zainstaluj Node.js, a potem uruchom ten plik ponownie.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalowanie zaleznosci...
  call npm install
  if errorlevel 1 (
    echo Instalacja zaleznosci nie powiodla sie.
    pause
    exit /b 1
  )
)

echo Sprawdzanie lokalnego panelu...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5174' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch { exit 1 }"
if not errorlevel 1 (
  echo LifeQuest juz dziala. Otwieram panel...
  start "" "http://127.0.0.1:5174"
  exit /b 0
)

echo Uruchamiam LifeQuest...
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:5174'"
call npm run dev -- --port 5174 --strictPort

endlocal
