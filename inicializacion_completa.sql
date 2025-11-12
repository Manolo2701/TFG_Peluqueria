-- Configurar UTF-8 para toda la sesiÃ³n
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Crear la base de datos si no existe (aunque ya deberÃ­a existir)
CREATE DATABASE IF NOT EXISTS peluqueria_selene CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE peluqueria_selene;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    rol ENUM('cliente', 'trabajador', 'administrador') DEFAULT 'cliente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla de trabajadores
CREATE TABLE IF NOT EXISTS trabajador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    especialidades JSON,
    descripcion TEXT,
    experiencia INT,
    horario_laboral JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    duracion INT NOT NULL,
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insertar usuarios bÃ¡sicos
INSERT IGNORE INTO usuario (id, email, password, nombre, apellidos, rol) VALUES
(1, 'cliente@ejemplo.com', '$2b$10$hashed_password', 'Cliente', 'Ejemplo', 'cliente'),
(2, 'pelu.selene@gmail.com', '$2b$10$hashed_password', 'Josefa', 'SM', 'administrador');

-- Insertar trabajador
INSERT IGNORE INTO trabajador (id, usuario_id, especialidades, descripcion, experiencia) VALUES
(1, 2, '["PeluquerÃ­a", "EstÃ©tica", "GestiÃ³n"]', 'Propietaria y administradora de la peluquerÃ­a', 10);

-- Insertar servicios con tildes correctas
INSERT IGNORE INTO servicio (id, nombre, descripcion, precio, duracion, categoria) VALUES
(1, 'Cejas Dar Forma', 'Dar forma a las cejas', 15.00, 15, 'EstÃ©tica'),
(2, 'Cera Labio Superior', 'DepilaciÃ³n con cera del labio superior', 10.00, 15, 'EstÃ©tica'),
(3, 'Cera Brazos', 'DepilaciÃ³n con cera de brazos', 25.00, 30, 'EstÃ©tica'),
(4, 'Cera Brazos Completos', 'DepilaciÃ³n con cera de brazos completos', 35.00, 45, 'EstÃ©tica'),
(5, 'Cera Medias Piernas', 'DepilaciÃ³n con cera de medias piernas', 25.00, 30, 'EstÃ©tica'),
(6, 'Cera Muslos', 'DepilaciÃ³n con cera de muslos', 30.00, 30, 'EstÃ©tica'),
(7, 'Cera Ingles', 'DepilaciÃ³n con cera de ingles', 20.00, 20, 'EstÃ©tica'),
(8, 'Cera Ingles BrasileÃ±as', 'DepilaciÃ³n con cera de ingles brasileÃ±as', 35.00, 45, 'EstÃ©tica'),
(9, 'Cera Ingles Completas', 'DepilaciÃ³n con cera de ingles completas', 45.00, 60, 'EstÃ©tica'),
(10, 'Cera Axilas', 'DepilaciÃ³n con cera de axilas', 15.00, 15, 'EstÃ©tica'),
(11, 'Cera GlÃºteos', 'DepilaciÃ³n con cera de glÃºteos', 35.00, 30, 'EstÃ©tica'),
(12, 'Cera LÃ­nea Alba', 'DepilaciÃ³n con cera de lÃ­nea alba', 10.00, 10, 'EstÃ©tica'),
(13, 'DepilaciÃ³n ElÃ©ctrica', 'DepilaciÃ³n elÃ©ctrica', 50.00, 60, 'EstÃ©tica'),
(14, 'Cera Pecho', 'DepilaciÃ³n con cera de pecho para caballeros', 35.00, 30, 'EstÃ©tica'),
(15, 'Cera Espalda', 'DepilaciÃ³n con cera de espalda para caballeros', 45.00, 45, 'EstÃ©tica'),
(16, 'Cera Piernas Enteras', 'DepilaciÃ³n con cera de piernas enteras para caballeros', 60.00, 60, 'EstÃ©tica'),
(17, 'Lavar y Peinar', 'Lavar y peinar estÃ¡ndar', 25.00, 30, 'PeluquerÃ­a'),
(18, 'Lavar y Peinar Pelo Largo', 'Lavar y peinar para pelo largo', 35.00, 45, 'PeluquerÃ­a'),
(19, 'Solo Corte', 'Corte de cabello estÃ¡ndar', 20.00, 30, 'PeluquerÃ­a'),
(20, 'Solo Corte Pelo Largo', 'Corte de cabello para pelo largo', 30.00, 45, 'PeluquerÃ­a'),
(21, 'Cortar y Peinar Pelo Corto', 'Corte y peinado para pelo corto', 35.00, 45, 'PeluquerÃ­a'),
(22, 'Cortar y Peinar Pelo Largo', 'Corte y peinado para pelo largo', 45.00, 60, 'PeluquerÃ­a'),
(23, 'Corte MÃ¡quina', 'Corte con mÃ¡quina', 15.00, 20, 'PeluquerÃ­a'),
(24, 'Corte NiÃ±o/a', 'Corte de cabello para niÃ±os/as', 18.00, 30, 'PeluquerÃ­a'),
(25, 'Corte Caballero', 'Corte de cabello para caballeros', 20.00, 30, 'PeluquerÃ­a'),
(26, 'ColÃ¡geno', 'Tratamiento de colÃ¡geno para la piel', 60.00, 60, 'Tratamientos'),
(27, 'Botox', 'Tratamiento de botox', 80.00, 90, 'Tratamientos'),
(28, 'HidrataciÃ³n', 'Tratamiento de hidrataciÃ³n profunda', 45.00, 45, 'Tratamientos'),
(29, 'NutriciÃ³n', 'Tratamiento de nutriciÃ³n capilar', 50.00, 60, 'Tratamientos');

-- Verificar que todo se insertÃ³ correctamente
SELECT '=== USUARIOS ===' as '';
SELECT id, email, nombre, apellidos, rol FROM usuario;

SELECT '=== TRABAJADORES ===' as '';
SELECT t.id, u.nombre, u.apellidos, t.especialidades, t.descripcion 
FROM trabajador t 
JOIN usuario u ON t.usuario_id = u.id;

SELECT '=== SERVICIOS ===' as '';
SELECT id, nombre, precio, categoria FROM servicio ORDER BY categoria, id;