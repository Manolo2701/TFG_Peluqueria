-- Reparar tabla usuario
ALTER TABLE usuario 
ADD COLUMN activo BOOLEAN DEFAULT TRUE,
ADD COLUMN direccion VARCHAR(255) NULL;

-- Reparar tabla reserva  
ALTER TABLE reserva 
ADD COLUMN politica_cancelacion ENUM('flexible', 'estricta', 'moderada') DEFAULT 'flexible',
ADD COLUMN fecha_cancelacion DATETIME NULL,
ADD COLUMN motivo_cancelacion TEXT NULL,
ADD COLUMN penalizacion_aplicada DECIMAL(10,2) DEFAULT 0;

-- Actualizar datos existentes
UPDATE usuario SET activo = TRUE WHERE activo IS NULL;

-- Verificar reparación
SELECT '=== TABLA USUARIO REPARADA ===' as '';
DESCRIBE usuario;

SELECT '=== TABLA RESERVA REPARADA ===' as '';
DESCRIBE reserva;

SELECT '=== USUARIOS ACTUALES ===' as '';
SELECT id, email, nombre, apellidos, rol, activo FROM usuario;