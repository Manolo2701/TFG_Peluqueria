@echo off
echo Reiniciando configuración de red...
docker-compose down
call install-windows.bat