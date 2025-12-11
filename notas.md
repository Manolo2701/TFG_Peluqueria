#### Instalación para LINUX (Debian/Ubuntu):
1. Abre una terminal
2. Ve al directorio: `cd ~/Desktop/TFG`
3. Dale permisos: `chmod +x install-linux.sh`
4. Ejecuta: `sudo usermod -aG docker $USER` y `newgrp docker`
5. Ejecuta: `./install-linux.sh`

## CREDENCIALES PARA LA DEMOSTRACIÓN

| Rol | Email | Contraseña | Para demostrar... |
|-----|-------|------------|-------------------|
| **Administrador Híbrido** | pelu.selene@gmail.com | pelu123 | Panel completo, todas las funciones |
| **Administrador** | adminnormal@gmail.com | admin | Solo funciones de admin |
| **Peluquera 1** | ana.rodriguez@selene.com | ana123 | Vista trabajador, reservas |
| **Peluquera 2** | marta.lopez@selene.com | mart123 | Vista trabajador alterniva |
| **Esteticista** | laura.garcia@selene.com | laur123 | Especialidad estética |

### Para permitir tildes
1. docker exec -it mysql_peluqueria bash
2. export LANG=C.UTF-8
3. export LC_ALL=C.UTF-8
4. mysql -u root -p --default-character-set=utf8mb4
5. use peluqueria_selene

### Para añadir nuevas categorías

UPDATE configuracion_negocio 
SET categorias_especialidades = '{
    "Peluquería": [
        "Cortes de cabello",
        "Coloración",
        "Mechas",
        "Tratamientos capilares",
        "Peinados"
    ],
    "Estética": [
        "Maquillaje",
        "Depilación",
        "Cuidado facial",
        "Uñas",
        "Masajes relajantes",
        "Masajes terapéuticos"
    ],
    "template": [
        "template1",
        "template2"
    ]
}'
WHERE id = 1;

### Para modificar el horario laboral
UPDATE configuracion_negocio
SET dias_apertura = '["martes", "miercoles", "jueves", "viernes", "sabado"]'
WHERE id = 1;

UPDATE configuracion_negocio
SET horario_apertura = '9:00:00'
WHERE id = 1;

UPDATE configuracion_negocio
SET horario_cierre = '20:00:00'
WHERE id = 1;
