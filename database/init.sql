-- Script de inicialización de Peluquería Selene
-- Se ejecuta automáticamente al crear el contenedor MySQL

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS peluqueria_selene 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE peluqueria_selene;

-- Tabla usuario
CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    rol ENUM('cliente', 'trabajador', 'administrador') DEFAULT 'cliente',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla servicio
CREATE TABLE IF NOT EXISTS servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    duracion INT NOT NULL,
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla trabajador
CREATE TABLE IF NOT EXISTS trabajador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    especialidades TEXT,
    categoria VARCHAR(50) NOT NULL DEFAULT 'Peluquería',
    descripcion TEXT,
    experiencia INT,
    horario_laboral JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla reserva (CON ESTADO 'rechazada' INCLUIDO)
CREATE TABLE IF NOT EXISTS reserva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    servicio_id INT NOT NULL,
    trabajador_id INT,
    fecha_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    duracion INT NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'rechazada') DEFAULT 'pendiente',
    notas TEXT,
    notas_internas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    politica_cancelacion ENUM('flexible', 'estricta', 'moderada') DEFAULT 'flexible',
    fecha_cancelacion DATETIME DEFAULT NULL,
    motivo_cancelacion TEXT,
    penalizacion_aplicada DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (cliente_id) REFERENCES usuario(id),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id),
    FOREIGN KEY (trabajador_id) REFERENCES usuario(id),
    INDEX idx_fecha (fecha_reserva),
    INDEX idx_estado (estado),
    INDEX idx_trabajador (trabajador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla ausencia_trabajador
CREATE TABLE IF NOT EXISTS ausencia_trabajador (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trabajador_id INT NOT NULL,
    tipo ENUM('vacaciones', 'enfermedad', 'personal', 'formacion', 'otro') NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    motivo TEXT,
    estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trabajador_id) REFERENCES trabajador(id) ON DELETE CASCADE,
    INDEX idx_trabajador (trabajador_id),
    INDEX idx_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla producto
CREATE TABLE IF NOT EXISTS producto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla carrito_item
CREATE TABLE IF NOT EXISTS carrito_item (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_producto (usuario_id, producto_id),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla venta
CREATE TABLE IF NOT EXISTS venta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'pendiente',
    metodo_pago ENUM('tarjeta', 'transferencia', 'paypal') DEFAULT 'tarjeta',
    transaccion_id VARCHAR(100) UNIQUE,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuario(id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_fecha (fecha_venta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla venta_detalle
CREATE TABLE IF NOT EXISTS venta_detalle (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES venta(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES producto(id),
    INDEX idx_venta (venta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla politica_cancelacion
CREATE TABLE IF NOT EXISTS politica_cancelacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    horas_limite INT NOT NULL COMMENT 'Horas antes de la cita para aplicar la política',
    porcentaje_penalizacion DECIMAL(5,2) NOT NULL COMMENT 'Porcentaje de penalización (0-100)',
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla configuracion_negocio
CREATE TABLE IF NOT EXISTS configuracion_negocio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_negocio VARCHAR(255) DEFAULT 'Peluquería Selene',
    horario_apertura TIME DEFAULT '09:00:00',
    horario_cierre TIME DEFAULT '20:00:00',
    dias_apertura JSON,
    tiempo_minimo_entre_reservas INT DEFAULT 15,
    maximo_reservas_por_dia INT DEFAULT 50,
    politica_cancelacion_default ENUM('flexible','moderada','estricta') DEFAULT 'moderada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla festivos
CREATE TABLE IF NOT EXISTS festivos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    recurrente BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- INSERTAR DATOS INICIALES
-- =============================================

-- Políticas de cancelación (con mensaje de próximamente)
INSERT IGNORE INTO politica_cancelacion (id, nombre, descripcion, horas_limite, porcentaje_penalizacion, activa) VALUES
(1, 'Flexible', 'Sistema de políticas en desarrollo - Próximamente', 24, 0.00, 1),
(2, 'Moderada', 'Sistema de políticas en desarrollo - Próximamente', 48, 0.00, 1),
(3, 'Estricta', 'Sistema de políticas en desarrollo - Próximamente', 72, 0.00, 1);

-- Configuración del negocio
INSERT IGNORE INTO configuracion_negocio (id, nombre_negocio, dias_apertura) VALUES 
(1, 'Peluquería Selene', '["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]');

-- Servicios de Peluquería Selene (EXACTAMENTE como los tienes)
INSERT IGNORE INTO servicio (id, nombre, descripcion, precio, duracion, categoria) VALUES
(1, 'Cejas Dar Forma', 'Dar forma a las cejas', 5.00, 15, 'Estética'),
(2, 'Cera Labio Superior', 'Depilación con cera del labio superior', 3.00, 15, 'Estética'),
(3, 'Cera Brazos', 'Depilación con cera de brazos', 8.00, 30, 'Estética'),
(4, 'Cera Brazos Completos', 'Depilación con cera de brazos completos', 10.00, 45, 'Estética'),
(5, 'Cera Medias Piernas', 'Depilación con cera de medias piernas', 10.00, 30, 'Estética'),
(6, 'Cera Muslos', 'Depilación con cera de muslos', 12.00, 30, 'Estética'),
(7, 'Cera Ingles', 'Depilación con cera de ingles', 6.00, 20, 'Estética'),
(8, 'Cera Ingles Brasileñas', 'Depilación con cera de ingles brasileñas', 8.00, 45, 'Estética'),
(9, 'Cera Ingles Completas', 'Depilación con cera de ingles completas', 10.00, 60, 'Estética'),
(10, 'Cera Axilas', 'Depilación con cera de axilas', 8.00, 15, 'Estética'),
(11, 'Cera Glúteos', 'Depilación con cera de glúteos', 6.00, 30, 'Estética'),
(12, 'Cera Línea Alba', 'Depilación con cera de línea alba', 5.00, 10, 'Estética'),
(13, 'Depilación Eléctrica', 'Depilación eléctrica', 6.00, 60, 'Estética'),
(14, 'Cera Pecho', 'Depilación con cera de pecho para caballeros', 15.00, 30, 'Estética'),
(15, 'Cera Espalda', 'Depilación con cera de espalda para caballeros', 15.00, 45, 'Estética'),
(16, 'Cera Piernas Enteras', 'Depilación con cera de piernas enteras para caballeros', 16.00, 60, 'Estética'),
(17, 'Lavar y Peinar', 'Lavar y peinar estándar', 10.00, 30, 'Peluquería'),
(18, 'Lavar y Peinar Pelo Largo', 'Lavar y peinar para pelo largo', 12.00, 45, 'Peluquería'),
(19, 'Solo Corte', 'Corte de cabello estándar', 10.00, 30, 'Peluquería'),
(20, 'Solo Corte Pelo Largo', 'Corte de cabello para pelo largo', 12.00, 45, 'Peluquería'),
(21, 'Cortar y Peinar Pelo Corto', 'Corte y peinado para pelo corto', 13.00, 45, 'Peluquería'),
(22, 'Cortar y Peinar Pelo Largo', 'Corte y peinado para pelo largo', 16.00, 60, 'Peluquería'),
(23, 'Corte Máquina', 'Corte con máquina', 5.00, 20, 'Peluquería'),
(24, 'Corte Niño/a', 'Corte de cabello para niños/as', 8.00, 30, 'Peluquería'),
(25, 'Corte Caballero', 'Corte de cabello para caballeros', 8.00, 30, 'Peluquería'),
(26, 'Colágeno', 'Tratamiento de colágeno para la piel', 10.00, 60, 'Peluquería'),
(27, 'Botox', 'Tratamiento de botox', 30.00, 90, 'Peluquería'),
(28, 'Hidratación', 'Tratamiento de hidratación profunda', 30.00, 45, 'Peluquería'),
(29, 'Nutrición', 'Tratamiento de nutrición capilar', 30.00, 60, 'Peluquería');

-- Productos de Peluquería Selene (con stock aleatorio)
INSERT IGNORE INTO producto (id, nombre, precio, stock) VALUES
(1, 'Champú', 15.00, 25),
(2, 'Mascarilla', 12.00, 30),
(3, 'Sérum', 12.00, 20),
(4, 'Espuma', 5.00, 40),
(5, 'Crema Hidratante', 12.00, 35),
(6, 'Secador', 35.00, 15),
(7, 'Plancha Pelo', 50.00, 10),
(8, 'Laca', 8.00, 50),
(9, 'Esmalte', 5.00, 60),
(10, 'Leche Limpiadora', 10.00, 25),
(11, 'Agua Micelar', 10.00, 30),
(12, 'Tónico', 10.00, 28),
(13, 'Crema Reafirmante', 30.00, 18),
(14, 'Contorno de Ojos', 20.00, 22);

-- =============================================
-- USUARIOS Y TRABAJADORES CON HASHES BCrypt CORRECTOS
-- =============================================

-- Usuario administrador (Josefa - pelu.selene@gmail.com / pelu123)
INSERT IGNORE INTO usuario (id, email, password, nombre, apellidos, rol) VALUES
(1, 'pelu.selene@gmail.com', '$2a$12$T4CGNfLrQgYrUPAl315YDeiLGHqSD4mk1WSIt6FgO2R76w8XMSlbW', 'Josefa', 'SM', 'administrador');

-- Registrar al administrador también como trabajador de ESTÉTICA
INSERT IGNORE INTO trabajador (usuario_id, especialidades, categoria, descripcion, experiencia) VALUES
(1, 'Estética general', 'Estética', 'Administradora principal y esteticista con amplia experiencia en todos los servicios de estética.', 8);

-- Nuevos trabajadores con hashes bcrypt CORRECTOS
-- Peluquera 1: Ana Rodríguez (ana123)
INSERT IGNORE INTO usuario (id, email, password, nombre, apellidos, telefono, rol) VALUES
(2, 'ana.rodriguez@selene.com', '$2a$12$Cu6bzGMRJTEHklZeysD.h.EpFf1JvLSaL0dOgVuiy7LwU9tGUdyl.', 'Ana', 'Rodríguez', '+34 612 345 678', 'trabajador');

-- Peluquera 2: Marta López (mart123)  
INSERT IGNORE INTO usuario (id, email, password, nombre, apellidos, telefono, rol) VALUES
(3, 'marta.lopez@selene.com', '$2a$12$HQFgQnul7mhFL0IsJiU1B.EIoOu7Xh5YwkSsM7jvstfIbqR5TNc3y', 'Marta', 'López', '+34 623 456 789', 'trabajador');

-- Esteticista: Laura García (lau123) - Nota: cambiamos a lau123 para que sean 3 letras
INSERT IGNORE INTO usuario (id, email, password, nombre, apellidos, telefono, rol) VALUES
(4, 'laura.garcia@selene.com', '$2a$12$qudJWwadOwaDLHUfOx6lTuI59MSAzkM5Fwhrw3q3PG5SYMTu5Laqe', 'Laura', 'García', '+34 634 567 890', 'trabajador');

-- Registrar los nuevos trabajadores
-- Ana Rodríguez - Peluquera
INSERT IGNORE INTO trabajador (usuario_id, especialidades, categoria, descripcion, experiencia) VALUES
(2, 'Cortes y tintes', 'Peluquería', 'Especialista en cortes modernos y tintes personalizados. Más de 5 años de experiencia en peluquería unisex.', 5);

-- Marta López - Peluquera
INSERT IGNORE INTO trabajador (usuario_id, especialidades, categoria, descripcion, experiencia) VALUES
(3, 'Peinados y recogidos', 'Peluquería', 'Especialista en peinados para eventos y recogidos elegantes. Formada en las últimas tendencias de peluquería.', 4);

-- Laura García - Esteticista
INSERT IGNORE INTO trabajador (usuario_id, especialidades, categoria, descripcion, experiencia) VALUES
(4, 'Depilación y cuidados faciales', 'Estética', 'Especialista en depilación con cera y tratamientos faciales personalizados. Formada en las mejores técnicas de estética.', 6);

-- Mensaje de finalización
SELECT '✅ Base de datos Peluquería Selene inicializada correctamente' as status;
SELECT '✅ Administrador registrado también como trabajador de Estética' as trabajador_status;
SELECT '✅ 3 nuevos trabajadores creados: 2 peluqueras y 1 esteticista' as nuevos_trabajadores;

SET FOREIGN_KEY_CHECKS = 1;