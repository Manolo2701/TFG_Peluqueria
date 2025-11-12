-- Configurar UTF-8 para toda la sesiÃ³n
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Eliminar y recrear la base de datos para asegurar UTF-8
DROP DATABASE IF EXISTS peluqueria_selene;
CREATE DATABASE peluqueria_selene CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE peluqueria_selene;

-- Tabla de usuarios
CREATE TABLE usuario (
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
CREATE TABLE trabajador (
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
CREATE TABLE servicio (
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
INSERT INTO usuario (id, email, password, nombre, apellidos, rol) VALUES
(1, 'cliente@ejemplo.com', '$2b$10$hashed_password', 'Cliente', 'Ejemplo', 'cliente'),
(2, 'pelu.selene@gmail.com', '$2b$10$hashed_password', 'Josefa', 'SM', 'administrador');

-- Insertar trabajador CON CARACTERES UNICODE EXPLÃCITOS
INSERT INTO trabajador (id, usuario_id, especialidades, descripcion, experiencia) VALUES
(1, 2, '[\"Peluquer\u00eda\", \"Est\u00e9tica\", \"Gesti\u00f3n\"]', 'Propietaria y administradora de la peluquer\u00eda', 10);

-- Insertar servicios CON CARACTERES UNICODE EXPLÃCITOS
INSERT INTO servicio (id, nombre, descripcion, precio, duracion, categoria) VALUES
(1, 'Cejas Dar Forma', 'Dar forma a las cejas', 15.00, 15, 'Est\u00e9tica'),
(2, 'Cera Labio Superior', 'Depilaci\u00f3n con cera del labio superior', 10.00, 15, 'Est\u00e9tica'),
(3, 'Cera Brazos', 'Depilaci\u00f3n con cera de brazos', 25.00, 30, 'Est\u00e9tica'),
(4, 'Cera Brazos Completos', 'Depilaci\u00f3n con cera de brazos completos', 35.00, 45, 'Est\u00e9tica'),
(5, 'Cera Medias Piernas', 'Depilaci\u00f3n con cera de medias piernas', 25.00, 30, 'Est\u00e9tica'),
(6, 'Cera Muslos', 'Depilaci\u00f3n con cera de muslos', 30.00, 30, 'Est\u00e9tica'),
(7, 'Cera Ingles', 'Depilaci\u00f3n con cera de ingles', 20.00, 20, 'Est\u00e9tica'),
(8, 'Cera Ingles Brasile\u00f1as', 'Depilaci\u00f3n con cera de ingles brasile\u00f1as', 35.00, 45, 'Est\u00e9tica'),
(9, 'Cera Ingles Completas', 'Depilaci\u00f3n con cera de ingles completas', 45.00, 60, 'Est\u00e9tica'),
(10, 'Cera Axilas', 'Depilaci\u00f3n con cera de axilas', 15.00, 15, 'Est\u00e9tica'),
(11, 'Cera Gl\u00fateos', 'Depilaci\u00f3n con cera de gl\u00fateos', 35.00, 30, 'Est\u00e9tica'),
(12, 'Cera L\u00ednea Alba', 'Depilaci\u00f3n con cera de l\u00ednea alba', 10.00, 10, 'Est\u00e9tica'),
(13, 'Depilaci\u00f3n El\u00e9ctrica', 'Depilaci\u00f3n el\u00e9ctrica', 50.00, 60, 'Est\u00e9tica'),
(14, 'Cera Pecho', 'Depilaci\u00f3n con cera de pecho para caballeros', 35.00, 30, 'Est\u00e9tica'),
(15, 'Cera Espalda', 'Depilaci\u00f3n con cera de espalda para caballeros', 45.00, 45, 'Est\u00e9tica'),
(16, 'Cera Piernas Enteras', 'Depilaci\u00f3n con cera de piernas enteras para caballeros', 60.00, 60, 'Est\u00e9tica'),
(17, 'Lavar y Peinar', 'Lavar y peinar est\u00e1ndar', 25.00, 30, 'Peluquer\u00eda'),
(18, 'Lavar y Peinar Pelo Largo', 'Lavar y peinar para pelo largo', 35.00, 45, 'Peluquer\u00eda'),
(19, 'Solo Corte', 'Corte de cabello est\u00e1ndar', 20.00, 30, 'Peluquer\u00eda'),
(20, 'Solo Corte Pelo Largo', 'Corte de cabello para pelo largo', 30.00, 45, 'Peluquer\u00eda'),
(21, 'Cortar y Peinar Pelo Corto', 'Corte y peinado para pelo corto', 35.00, 45, 'Peluquer\u00eda'),
(22, 'Cortar y Peinar Pelo Largo', 'Corte y peinado para pelo largo', 45.00, 60, 'Peluquer\u00eda'),
(23, 'Corte M\u00e1quina', 'Corte con m\u00e1quina', 15.00, 20, 'Peluquer\u00eda'),
(24, 'Corte Ni\u00f1o/a', 'Corte de cabello para ni\u00f1os/as', 18.00, 30, 'Peluquer\u00eda'),
(25, 'Corte Caballero', 'Corte de cabello para caballeros', 20.00, 30, 'Peluquer\u00eda'),
(26, 'Col\u00e1geno', 'Tratamiento de col\u00e1geno para la piel', 60.00, 60, 'Tratamientos'),
(27, 'Botox', 'Tratamiento de botox', 80.00, 90, 'Tratamientos'),
(28, 'Hidrataci\u00f3n', 'Tratamiento de hidrataci\u00f3n profunda', 45.00, 45, 'Tratamientos'),
(29, 'Nutrici\u00f3n', 'Tratamiento de nutrici\u00f3n capilar', 50.00, 60, 'Tratamientos');

-- Verificar que todo se insertÃ³ correctamente
SELECT '=== USUARIOS ===' as '';
SELECT id, email, nombre, apellidos, rol FROM usuario;

SELECT '=== TRABAJADORES ===' as '';
SELECT t.id, u.nombre, u.apellidos, t.especialidades, t.descripcion 
FROM trabajador t 
JOIN usuario u ON t.usuario_id = u.id;

SELECT '=== SERVICIOS ===' as '';
SELECT id, nombre, precio, categoria FROM servicio ORDER BY categoria, id;