#!/bin/bash
echo "==========================================="
echo "   PELUQUERIA SELENE - TFG (Linux)"
echo "==========================================="
echo ""

# Verificar si se tiene docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker no está instalado."
    echo "Instalando Docker y Docker Compose..."
    
    # Instalar Docker
    sudo apt update
    sudo apt install -y docker.io
    
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

echo "2. Construyendo e iniciando la aplicación..."
echo "(Esto puede tardar varios minutos en la primera ejecución)"
docker-compose up --build -d

echo "3. Esperando 60 segundos para que todo se inicie..."
sleep 60

# Obtener la IP
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "✅ ¡INSTALACIÓN COMPLETADA!"
echo "==========================================="
echo ""
echo "🌐 ACCESO DESDE ESTE ORDENADOR:"
echo "   Abre el navegador y ve a: http://localhost"
echo ""
echo "📱 ACCESO DESDE OTROS DISPOSITIVOS:"
echo "   1. Conecta otros dispositivos a la misma red"
echo "   2. Abre un navegador"
echo "   3. Ve a: http://$IP"
echo ""
echo "🔐 CREDENCIALES DE DEMOSTRACIÓN:"
echo "   Administrador: pelu.selene@gmail.com / pelu123"
echo "   Peluquera 1: ana.rodriguez@selene.com / ana123"
echo "   Peluquera 2: marta.lopez@selene.com / mart123"
echo "   Esteticista: laura.garcia@selene.com / lau123"
echo ""
echo "📋 COMANDOS ÚTILES:"
echo "   Ver logs: docker-compose logs -f"
echo "   Detener: docker-compose down"
echo "   Reiniciar: docker-compose restart"
echo "   Estado: docker ps"
echo ""