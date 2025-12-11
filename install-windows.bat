@echo off
echo ===========================================
echo    PELUQUERIA SELENE - TFG (Windows)
echo    INSTALADOR AUTOMATICO
echo ===========================================
echo.

echo 1. Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop no esta instalado.
    echo Por favor, descarga e instala Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop/
    echo Despues de instalar, REINICIA el ordenador.
    pause
    exit /b 1
)

echo 2. Deteniendo servicios previos...
docker-compose down >nul 2>&1

echo 3. Eliminando archivos .env conflictivos...
if exist backend\.env del backend\.env >nul 2>&1
if exist frontend\.env del frontend\.env >nul 2>&1

echo 4. Detectando IP de red local AUTOMATICAMENTE...
REM Usamos PowerShell para obtener la IP activa de la red
powershell -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -eq 'Dhcp' -and $_.InterfaceAlias -notlike '*Virtual*' -and $_.InterfaceAlias -notlike '*VMware*' -and $_.InterfaceAlias -notlike '*VirtualBox*' } | Select-Object -First 1).IPAddress; if ($ip) { Write-Output $ip } else { Write-Output '127.0.0.1' }" > ip_temp.txt
set /p IP=<ip_temp.txt
del ip_temp.txt

echo 5. Configurando entorno con IP detectada: %IP%
(
  echo # IP del servidor (configurado automaticamente)
  echo SERVER_IP=%IP%
  echo.
  echo # Backend
  echo NODE_ENV=production
  echo PORT=3000
  echo DB_HOST=mysql
  echo DB_PORT=3306
  echo DB_USER=root
  echo DB_PASSWORD=root
  echo DB_NAME=peluqueria_selene
  echo JWT_SECRET=clave_secreta_tfg_expo_2025
  echo JWT_EXPIRES_IN=7d
  echo HOST=0.0.0.0
  echo.
  echo # Docker
  echo DOCKER_ENV=true
  echo.
  echo # CORS - Se agrega la IP detectada automaticamente
  echo FRONTEND_URL=http://localhost,http://nginx,http://%IP%
) > .env

echo 6. Construyendo e iniciando la aplicacion...
echo (Esto puede tardar varios minutos en la primera ejecucion)
docker-compose up --build -d

echo 7. Esperando 60 segundos para que todo se inicie...
timeout /t 60 /nobreak >nul

echo.
echo ✅ ¡INSTALACION COMPLETADA!
echo ===========================================
echo.
echo 🌐 ACCESO DESDE ESTE ORDENADOR:
echo    Abre tu navegador y ve a: http://localhost
echo.
echo 📱 ACCESO DESDE OTROS DISPOSITIVOS EN LA RED:
echo   1. Conecta otros dispositivos a la misma red WiFi
echo   2. Abre un navegador
echo   3. Ve a: http://%IP%
echo   4. O escanea este codigo QR (si tu navegador lo soporta):
echo.
echo 🔐 CREDENCIALES DE DEMOSTRACION:
echo   Administrador/esteticista: pelu.selene@gmail.com / pelu123
echo   Peluquera 1: ana.rodriguez@selene.com / ana123
echo   Peluquera 2: marta.lopez@selene.com / mart123
echo   Esteticista: laura.garcia@selene.com / lau123
echo.
echo 📋 COMANDOS UTILES:
echo   Ver logs: docker-compose logs -f
echo   Detener: docker-compose down
echo   Reiniciar: docker-compose restart
echo   Ver contenedores: docker ps
echo.
echo ⚠️  IMPORTANTE: Si cambias de red o la IP cambia:
echo   1. Ejecuta este script nuevamente
echo.
pause