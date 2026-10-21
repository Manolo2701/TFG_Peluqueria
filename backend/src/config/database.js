const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.DB_NAME || 'peluqueria_selene',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'local',
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true
};

console.log('Configuración de base de datos:');
console.log('   Host:', dbConfig.host);
console.log('   Puerto:', dbConfig.port);
console.log('   Usuario:', dbConfig.user);
console.log('   Base de datos:', dbConfig.database);

const pool = mysql.createPool(dbConfig);

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT NOW() as server_time, DATABASE() as current_database');
    console.log('Conectado a MySQL - Peluquería Selene');
    console.log('Hora del servidor:', rows[0].server_time);
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
