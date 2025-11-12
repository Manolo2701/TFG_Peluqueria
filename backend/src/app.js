const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');
require('dotenv').config();

// Inicializar sistema de cancelación al arrancar
const Reserva = require('./models/Reserva');
Reserva.inicializarSistemaCancelacion().then(success => {
  if (success) {
    console.log('[SISTEMA] Sistema de cancelacion listo');
  } else {
    console.log('[SISTEMA] Sistema de cancelacion con errores, pero servidor continua');
  }
});

// Manejo de errores global
process.on('uncaughtException', (error) => {
  console.error('[SISTEMA] UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SISTEMA] UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const app = express();

// **MIDDLEWARE PARA UTF-8 - AGREGADO AL INICIO**
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// MIDDLEWARE CORREGIDO - SOLUCIÓN AL PROBLEMA DEL LOGIN
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('[SISTEMA] JSON malformado recibido:', buf.toString());
      res.status(400).json({ error: 'JSON malformado' });
      throw new Error('JSON malformado');
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Middleware de logging para debug
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/auth/login') {
    console.log('[AUTH] Login request body:', req.body);
    console.log('[AUTH] Login request headers:', req.headers['content-type']);
  }
  next();
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

// **MIDDLEWARE ADICIONAL PARA UTF-8 - AGREGADO DESPUÉS DE CORS**
app.use((req, res, next) => {
  // Forzar UTF-8 en todas las respuestas JSON
  const originalSend = res.send;
  res.send = function (data) {
    if (typeof data === 'object' || (typeof data === 'string' && data.trim().startsWith('{'))) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    originalSend.call(this, data);
  };
  next();
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use(limiter);

console.log('[SISTEMA] Iniciando servidor Peluqueria Selene...');
console.log('[SISTEMA] Middlewares configurados');
console.log('[SISTEMA] Configuración UTF-8 aplicada');

// Rutas
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const servicioRoutes = require('./routes/servicios');
const reservaRoutes = require('./routes/reservas');
const trabajadorRoutes = require('./routes/trabajadores');
const calendarioRoutes = require('./routes/calendario');
const ventaRoutes = require('./routes/ventas');
const cancelacionRoutes = require('./routes/cancelacion');
const configuracionRoutes = require('./routes/configuracion');
const busquedaRoutes = require('./routes/busqueda');
const paypalRoutes = require('./routes/paypal');
const productoRoutes = require('./routes/productos');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/trabajadores', trabajadorRoutes);
app.use('/api/calendario', calendarioRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/cancelacion', cancelacionRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/busqueda', busquedaRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/dashboard', dashboardRoutes);

console.log('[SISTEMA] Rutas inicializadas');

// Endpoint de test mejorado
app.post('/test-json', (req, res) => {
  console.log('[TEST] Request body recibido:', req.body);
  console.log('[TEST] Headers:', req.headers);
  res.json({
    recibido: req.body,
    headers: req.headers,
    mensaje: 'JSON recibido correctamente'
  });
});

// Endpoint de test para UTF-8
app.get('/api/test-encoding', (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({
    testText: "María García López",
    specialChars: "áéíóúñÑ",
    message: "Test de caracteres especiales",
    usuarios: [
      { nombre: "María García López", email: "admin@selene.com" },
      { nombre: "Carlos Martínez Ruiz", email: "peluquero1@selene.com" },
      { nombre: "Ana Gómez Sánchez", email: "peluquero2@selene.com" }
    ]
  });
});

app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'OK',
    message: 'Backend funcionando',
    database: dbStatus ? 'Conectado' : 'Error',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    encoding: 'UTF-8 configurado'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '¡Bienvenido a la API de Peluquería Selene!',
    version: '1.0.0',
    encoding: 'UTF-8',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      servicios: '/api/servicios',
      reservas: '/api/reservas',
      trabajadores: '/api/trabajadores',
      cancelacion: '/api/cancelacion',
      test: '/test-json',
      encodingTest: '/api/test-encoding'
    }
  });
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware de error global
app.use((error, req, res, next) => {
  console.error('[SISTEMA] Error no manejado:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.log('[SISTEMA] Servidor iniciado sin conexion a base de datos');
    } else {
      console.log('[SISTEMA] Conectado a MySQL - Verificando/creando tablas...');
      const { createTables } = require('./config/database');
      await createTables();
    }

    app.listen(PORT, () => {
      console.log('[SISTEMA] Servidor corriendo en puerto ' + PORT);
      console.log('[SISTEMA] Middleware de JSON configurado correctamente');
      console.log('[SISTEMA] Sistema de politicas de cancelacion listo');
      console.log('[SISTEMA] Configuración UTF-8 activa');
    });
  } catch (error) {
    console.error('[SISTEMA] Error iniciando el servidor:', error);
  }
}

startServer();