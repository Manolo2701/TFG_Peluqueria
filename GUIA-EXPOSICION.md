# 🎓 GUÍA PARA LA EXPOSICIÓN DEL TFG

## 📋 ANTES DE LA EXPOSICIÓN

### Lleva en un pendrive:
1. Toda la carpeta `TFG` (tu proyecto completo)
2. Esta guía impresa (opcional)

### En el pendrive debe estar:
TFG/
├── backend/ # Código del backend
├── frontend/ # Código del frontend
├── database/ # Base de datos (init.sql)
├── docker-compose.yml # Configuración Docker
├── install-windows.bat # Instalador Windows
├── install-linux.sh # Instalador Linux
└── GUIA-EXPOSICION.md # Esta guía


## DÍA DE LA EXPOSICIÓN

### Paso 1: Copiar el proyecto
- Conecta el pendrive al PC de exposición
- Copia la carpeta `TFG` al escritorio

### Paso 2: Ejecutar el instalador correcto

#### Si el PC es WINDOWS:
1. Abre la carpeta `TFG` en el escritorio
2. Haz doble clic en `install-windows.bat`
3. Espera a que termine (verá mensajes en pantalla)
4. Cuando termine, muestra la pantalla final a los jueces

#### Si el PC es LINUX (Debian/Ubuntu):
1. Abre una terminal
2. Ve al directorio: `cd ~/Desktop/TFG`
3. Dale permisos: `chmod +x install-linux.sh`
4. Ejecuta: `./install-linux.sh`
5. Sigue las instrucciones que aparecen

### Paso 3: Mostrar la aplicación

Conectarse a:

http://[LA-IP-QUE-MUESTRA-EL-INSTALADOR]


## CREDENCIALES PARA LA DEMOSTRACIÓN

| Rol | Email | Contraseña | Para demostrar... |
|-----|-------|------------|-------------------|
| **Administrador** | pelu.selene@gmail.com | pelu123 | Panel completo, todas las funciones |
| **Peluquera 1** | ana.rodriguez@selene.com | ana123 | Vista trabajador, reservas |
| **Peluquera 2** | marta.lopez@selene.com | mart123 | Vista trabajador alternativa |
| **Esteticista** | laura.garcia@selene.com | lau123 | Especialidad estética |

## SOLUCIÓN DE PROBLEMAS

### Si la aplicación no carga:
```bash
# Ver qué está pasando
docker-compose logs

# Reiniciar todo
docker-compose down
docker-compose up -d