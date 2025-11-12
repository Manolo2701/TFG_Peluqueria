const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'peluqueria_selene',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'local',
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  typeCast: function (field, next) {
    if (field.type === 'STRING' || field.type === 'VAR_STRING') {
      return field.string();
    }
    return next();
  }
};

console.log('🔧 Configuración de Base de Datos:');
console.log('   Host:', dbConfig.host);
console.log('   Puerto:', dbConfig.port);
console.log('   Usuario:', dbConfig.user);
console.log('   Base de datos:', dbConfig.database);

const pool = mysql.createPool(dbConfig);

// Función para crear todas las tablas
async function createTables() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('📊 Verificando/Creando tablas...');

    // Tabla usuario
    const createUsuarioTable = `
      CREATE TABLE IF NOT EXISTS usuario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        apellidos VARCHAR(255),
        telefono VARCHAR(20),
        direccion TEXT,
        rol ENUM('cliente', 'trabajador', 'administrador') DEFAULT 'cliente',
        activo BOOLEAN DEFAULT TRUE,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_rol (rol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.execute(createUsuarioTable);
    console.log('✅ Tabla usuario verificada/creada correctamente');

    // Tabla servicio
    const createServicioTable = `
      CREATE TABLE IF NOT EXISTS servicio (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        duracion INT NOT NULL COMMENT 'Duración en minutos',
        precio DECIMAL(10,2) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_categoria (categoria),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.execute(createServicioTable);
    console.log('✅ Tabla servicio verificada/creada correctamente');

    // Tabla trabajador
    const createTrabajadorTable = `
      CREATE TABLE IF NOT EXISTS trabajador (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL UNIQUE,
        especialidades JSON,
        categoria TEXT,
        descripcion TEXT,
        experiencia INT,
        horario_laboral JSON,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuario(id),
        INDEX idx_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.execute(createTrabajadorTable);
    console.log('✅ Tabla trabajador verificada/creada correctamente');

    // Tabla reserva
    const createReservaTable = `
    CREATE TABLE IF NOT EXISTS reserva (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT NOT NULL,
      servicio_id INT NOT NULL,
      trabajador_id INT,
      fecha_reserva DATE NOT NULL,
      hora_inicio TIME NOT NULL,
      duracion INT NOT NULL,
      estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada') DEFAULT 'pendiente',
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
`;
    await connection.execute(createReservaTable);
    console.log('✅ Tabla reserva verificada/creada correctamente');

    // Tabla ausencia_trabajador
    const createAusenciaTrabajadorTable = `
      CREATE TABLE IF NOT EXISTS ausencia_trabajador (
        id INT PRIMARY KEY AUTO_INCREMENT,
        trabajador_id INT NOT NULL,
        tipo ENUM('vacaciones', 'enfermedad', 'personal', 'formacion', 'otro') NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE NOT NULL,
        motivo TEXT,
        estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES trabajador(usuario_id),
        INDEX idx_trabajador (trabajador_id),
        INDEX idx_fechas (fecha_inicio, fecha_fin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.execute(createAusenciaTrabajadorTable);
    console.log('✅ Tabla ausencia_trabajador verificada/creada correctamente');

    // Tabla producto
    const createProductoTable = `
      CREATE TABLE IF NOT EXISTS producto (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        categoria VARCHAR(100) DEFAULT 'general',
        imagen_url VARCHAR(500),
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.execute(createProductoTable);
    console.log('✅ Tabla producto verificada/creada correctamente');

    // Tabla carrito_item
    const createCarritoItemTable = `
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
    `;
    await connection.execute(createCarritoItemTable);
    console.log('✅ Tabla carrito_item verificada/creada correctamente');

    // Tabla venta
    const createVentaTable = `
      CREATE TABLE IF NOT EXISTS venta (
        id INT PRIMARY KEY AUTO_INCREMENT,
      cliente_id INT NOT NULL,
      trabajador_id INT,
      reserva_id INT,
      total DECIMAL(10,2) NOT NULL,
      estado ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'pendiente',
      metodo_pago ENUM('efectivo', 'tarjeta', 'transferencia') DEFAULT 'efectivo',
      notas TEXT,
      fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES usuario(id),
      FOREIGN KEY (trabajador_id) REFERENCES usuario(id),
      FOREIGN KEY (reserva_id) REFERENCES reserva(id),
      INDEX idx_cliente (cliente_id),
      INDEX idx_trabajador (trabajador_id),
      INDEX idx_fecha (fecha_venta)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
    await connection.execute(createVentaTable);
    console.log('✅ Tabla venta verificada/creada correctamente');

    // Tabla venta_detalle
    const createVentaDetalleTable = `
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
    `;
    await connection.execute(createVentaDetalleTable);
    console.log('✅ Tabla venta_detalle verificada/creada correctamente');

    // Tabla politica_cancelacion
    const createPoliticaCancelacionTable = `
      CREATE TABLE IF NOT EXISTS politica_cancelacion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        horas_limite INT NOT NULL COMMENT 'Horas antes de la cita para aplicar la política',
        porcentaje_penalizacion DECIMAL(5,2) NOT NULL COMMENT 'Porcentaje de penalización (0-100)',
        activa BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.execute(createPoliticaCancelacionTable);
    console.log('✅ Tabla politica_cancelacion verificada/creada correctamente');

    // Insertar políticas por defecto
    const insertPoliticas = `
      INSERT IGNORE INTO politica_cancelacion (id, nombre, descripcion, horas_limite, porcentaje_penalizacion, activa) VALUES
      (1, 'Flexible', 'Cancelación gratuita hasta 24 horas antes', 24, 10.00, 1),
      (2, 'Moderada', '25% de penalización si se cancela con menos de 48 horas', 48, 25.00, 1),
      (3, 'Estricta', '50% de penalización si se cancela con menos de 72 horas', 72, 50.00, 1);
    `;
    await connection.execute(insertPoliticas);
    console.log('✅ Políticas de cancelación insertadas por defecto');

    // Tabla configuracion_negocio (CORREGIDA - sin DEFAULT en JSON)
    const createConfiguracionNegocioTable = `
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
    `;
    await connection.execute(createConfiguracionNegocioTable);
    console.log('✅ Tabla configuracion_negocio verificada/creada correctamente');

    // Tabla festivos
    const createFestivosTable = `
      CREATE TABLE IF NOT EXISTS festivos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        fecha DATE NOT NULL,
        motivo VARCHAR(255) NOT NULL,
        recurrente BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_fecha (fecha)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.execute(createFestivosTable);
    console.log('✅ Tabla festivos verificada/creada correctamente');

    // Insertar configuración por defecto (CORREGIDA - con JSON explícito)
    const insertConfiguracion = `
      INSERT IGNORE INTO configuracion_negocio 
      (id, nombre_negocio, dias_apertura) 
      VALUES (1, 'Peluquería Selene', '["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]');
    `;
    await connection.execute(insertConfiguracion);
    console.log('✅ Configuración por defecto insertada');

  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Función de testConnection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT NOW() as server_time, DATABASE() as current_database');
    console.log('✅ Conectado a MySQL - Peluquería Selene');
    console.log('   Hora del servidor:', rows[0].server_time);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    return false;
  }
}

// NOTA: Eliminamos la llamada automática a createTables() aquí
// para evitar la doble inicialización. Ahora solo se llama desde app.js

module.exports = {
  pool,
  testConnection,
  createTables
};