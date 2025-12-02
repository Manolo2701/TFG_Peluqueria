echo Configurando IP para acceso en red local...

REM Usamos PowerShell para obtener la IP de la interfaz con la puerta de enlace predeterminada
for /f "tokens=*" %%i in ('powershell -Command "Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -ExpandProperty IPv4Address | Select-Object -ExpandProperty IPAddress"') do (
    set IP=%%i
)

if "%IP%"=="" (
    echo No se pudo detectar automaticamente la IP de la red local.
    echo Por favor, introduce manualmente la IP de este equipo en la red local.
    set /p IP="IP local (ej: 192.168.1.100): "
)

echo IP local detectada: %IP%
echo Actualizando configuracion para usar IP: %IP%
powershell -Command "(Get-Content .env) -replace 'SERVER_IP=.*', 'SERVER_IP=%IP%' | Set-Content .env"


@echo off
echo ===========================================
echo    PELUQUERIA SELENE - TFG (Windows)
echo ===========================================
echo.

echo 1. Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop no esta instalado.
    echo Por favor, descarga e instala Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop/
    echo Despues de instalar, reinicia el ordenador.
    pause
    exit /b 1
)

echo 2. Deteniendo servicios previos...
docker-compose down >nul 2>&1

echo 3. Construyendo e iniciando la aplicacion...
echo (Esto puede tardar varios minutos en la primera ejecucion)
docker-compose up --build -d

echo 4. Esperando 50 segundos para que todo se inicie...
timeout /t 50 /nobreak >nul

echo.
echo ✅ ¡INSTALACION COMPLETADA!
echo ===========================================
echo.
echo 🌐 ACCESO DESDE ESTE ORDENADOR:
echo    Abre tu navegador y ve a: http://localhost
echo.
echo 📱 ACCESO DESDE OTROS DISPOSITIVOS:
echo   1. Conecta otros dispositivos a la misma red WiFi
echo   2. Abre un navegador
echo   3. Ve a: http://%IP%
echo   4. Para saber tu IP local, ejecuta en otra terminal: ipconfig
echo.
echo 🔐 CREDENCIALES DE DEMOSTRACION:
echo   Administrador/esteticista: pelu.selene@gmail.com / pelu123
echo   Peluquera 1: ana.rodriguez@selene.com / ana123
echo   Peluquera 2: marta.lopez@selene.com / mart123
echo   Esteticista: laura.garcia@selene.com / lau123
echo.
echo 📋 COMANDOS UTILES:
echo   Ver logs en vivo: docker-compose logs -f
echo   Detener aplicacion: docker-compose down
echo   Reiniciar: docker-compose restart
echo   Ver contenedores: docker ps
echo.
pause