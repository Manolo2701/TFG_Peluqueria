#!/bin/bash

echo "==========================================="
echo "   PELUQUERIA SELENE - TFG (Linux)"
echo "   INSTALADOR AUTOMATICO"
echo "==========================================="
echo ""

# Verificar si se tiene docker
if ! command -v docker &> /dev/null; then
   echo "⚠️  Docker no está instalado."
   echo "Instalando Docker y Docker Compose..."
  
   # Instalar Docker
   sudo apt update
   sudo apt install -y docker.io
  
   # Verificar si curl está instalado, si no, instalarlo
   if ! command -v curl &> /dev/null; then
       echo "⚠️ curl no está instalado. Instalando curl..."
       sudo apt install -y curl
   fi
  
   # Instalar Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
  
   # Añadir usuario al grupo docker
   sudo usermod -aG docker $USER
   echo "⚠️  IMPORTANTE: Cierra sesión y vuelve a entrar para que los cambios surtan efecto."
   echo "O ejecuta: newgrp docker"
   echo ""
   read -p "Presiona Enter para continuar..." </dev/tty
fi

echo "1. Deteniendo servicios previos..."
docker-compose down 2>/dev/null

echo "2. Eliminando archivos .env conflictivos..."
rm -f backend/.env 2>/dev/null
rm -f frontend/.env 2>/dev/null

echo "3. Detectando IP de red local AUTOMATICAMENTE..."
# Método 1: Obtener IP de la ruta por defecto
IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')

# Método 2: Si falla, usar hostname
if [ -z "$IP" ] || [ "$IP" = "127.0.0.1" ]; then
   IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

# Método 3: Si sigue sin funcionar, pedir al usuario
if [ -z "$IP" ] || [ "$IP" = "127.0.0.1" ]; then
   echo "⚠️  No se pudo detectar la IP automáticamente."
   read -p "Por favor, introduce la IP de esta máquina en la red local: " IP
fi

echo "4. Configurando entorno con IP detectada: $IP"
cat > .env << EOF
# IP del servidor (configurado automaticamente)
SERVER_IP=$IP

# Backend
NODE_ENV=production
PORT=3000
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=peluqueria_selene
JWT_SECRET=clave_secreta_tfg_expo_2025
JWT_EXPIRES_IN=7d
HOST=0.0.0.0

# Docker
DOCKER_ENV=true

# CORS - Se agrega la IP detectada automaticamente
FRONTEND_URL=http://localhost,http://nginx,http://$IP
EOF

echo "5. Construyendo e iniciando la aplicación..."
echo "(Esto puede tardar varios minutos en la primera ejecución)"
docker-compose up -d --build

echo "6. Esperando 60 segundos para que todo se inicie..."
sleep 60

echo ""
echo " ¡INSTALACIÓN COMPLETADA!"
echo "==========================================="
echo ""
echo " ACCESO DESDE ESTE ORDENADOR:"
echo "   Abre el navegador y ve a: http://localhost"
echo ""
echo " ACCESO DESDE OTROS DISPOSITIVOS EN LA RED:"
echo "   1. Conecta otros dispositivos a la misma red"
echo "   2. Abre un navegador"
echo "   3. Ve a: http://$IP"
echo ""
echo " CREDENCIALES DE DEMOSTRACIÓN:"
echo "   Administrador: pelu.selene@gmail.com / pelu123"
echo "   Peluquera 1: ana.rodriguez@selene.com / ana123"
echo "   Peluquera 2: marta.lopez@selene.com / mart123"
echo "   Esteticista: laura.garcia@selene.com / lau123"
echo ""
echo " COMANDOS ÚTILES:"
echo "   Ver logs: docker-compose logs -f"
echo "   Detener: docker-compose down"
echo "   Reiniciar: docker-compose restart"
echo "   Estado: docker ps"
echo ""
echo "  IMPORTANTE: Si cambias de red o la IP cambia:"
echo "   1. Ejecuta este script nuevamente"
echo ""

