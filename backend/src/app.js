const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');  // ✅ Ruta corregida
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

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

// **CONFIGURACIÓN CORS MEJORADA - PERMITE CUALQUIER IP EN DESARROLLO**
// Para producción, configurar FRONTEND_URL en las variables de entorno
const corsOptions = {
  origin: function (origin, callback) {
    // En desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CORS] Desarrollo: Permitido origen: ${origin}`);
      return callback(null, true);
    }

    // En producción, usar la configuración de FRONTEND_URL
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : [];

    // Si no hay origen (peticiones desde apps móviles, Postman, etc.)
    if (!origin) return callback(null, true);

    // Verificar si el origen está en la lista de permitidos
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      console.log(`[CORS] Producción: Origen permitido: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`[CORS] Producción: Origen bloqueado: ${origin}`);
      return callback(new Error('Origen no permitido por CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

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

console.log('[SISTEMA] Iniciando servidor Peluquería Selene...');
console.log('[SISTEMA] Middlewares configurados');
console.log('[SISTEMA] Configuración UTF-8 aplicada');

// Rutas - ✅ TODAS LAS RUTAS CORREGIDAS
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

// Nuevo endpoint para monitoreo del servicio automático
app.get('/api/reservas/estado-automatico', async (req, res) => {
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const ReservaAutoService = require('./services/reservaAutoService');  // ✅ Ruta corregida
    const estado = await ReservaAutoService.obtenerEstadoServicio();
    res.json(estado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: 'OK',
    message: 'Backend funcionando',
    database: dbStatus ? 'Conectado' : 'Error',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    encoding: 'UTF-8 configurado',
    servicios: {
      reservasAutomaticas: 'Activo (setInterval)'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '¡Bienvenido a la API de Peluquería Selene!',
    version: '1.0.0',
    encoding: 'UTF-8',
    servicios_automaticos: {
      reservas: 'Activo - Verifica reservas cada minuto (setInterval)'
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      servicios: '/api/servicios',
      reservas: '/api/reservas',
      trabajadores: '/api/trabajadores',
      cancelacion: '/api/cancelacion',
      estado_automatico: '/api/reservas/estado-automatico',
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
    console.log('[SISTEMA] Verificando conexión a base de datos...');

    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.log('[SISTEMA] ⚠️  Servidor iniciado sin conexión a base de datos');
    } else {
      console.log('[SISTEMA] ✅ Conectado a MySQL - Base de datos lista');
    }

    // Inicializar sistema de cancelación después de que la BD esté lista
    console.log('[SISTEMA] Inicializando sistema de cancelación...');
    const Reserva = require('./models/Reserva');  // ✅ Ruta corregida
    const cancelacionSuccess = await Reserva.inicializarSistemaCancelacion();

    if (cancelacionSuccess) {
      console.log('[SISTEMA] ✅ Sistema de cancelación listo');
    } else {
      console.log('[SISTEMA] ⚠️  Sistema de cancelación con errores, pero servidor continúa');
    }

    // Inicializar sistema automático de reservas después de que la BD esté lista
    console.log('[SISTEMA] Inicializando servicio automático de reservas...');
    const ReservaAutoService = require('./services/reservaAutoService');  // ✅ Ruta corregida

    // Esperar un poco antes de iniciar el servicio automático
    setTimeout(() => {
      ReservaAutoService.iniciar();
      console.log('[SISTEMA] ⏰ Servicio automático de reservas iniciado (setInterval)');
    }, 5000); // Esperar 5 segundos después de la inicialización de la BD

    // Manejo de errores global
    process.on('uncaughtException', (error) => {
      console.error('[SISTEMA] UNCAUGHT EXCEPTION:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[SISTEMA] UNHANDLED REJECTION at:', promise, 'reason:', reason);
    });

    // **ESCUCHAR EN TODAS LAS INTERFACES DE RED (0.0.0.0)**
    app.listen(PORT, '0.0.0.0', () => {
      console.log('[SISTEMA] ==========================================');
      console.log('[SISTEMA] 🚀 Servidor corriendo en puerto ' + PORT);
      console.log('[SISTEMA] 🌐 Accesible desde cualquier dispositivo en la red');
      console.log('[SISTEMA] ✅ Base de datos inicializada y lista');
      console.log('[SISTEMA] ✅ Middleware de JSON configurado correctamente');
      console.log('[SISTEMA] ✅ Sistema de políticas de cancelación listo');
      console.log('[SISTEMA] ⏰ Servicio automático de reservas configurado');
      console.log('[SISTEMA] ✅ Configuración UTF-8 activa');
      console.log('[SISTEMA] ✅ CORS configurado para cualquier origen en desarrollo');
      console.log('[SISTEMA] ==========================================');
      console.log('[SISTEMA] 📱 Para acceder desde otros dispositivos:');
      console.log('[SISTEMA] 1. Asegúrate que estén en la misma red');
      console.log('[SISTEMA] 2. Usa la IP de este equipo + puerto 3000');
      console.log('[SISTEMA] 3. Ejemplo: http://192.168.1.100:3000');
      console.log('[SISTEMA] ==========================================');
    });
  } catch (error) {
    console.error('[SISTEMA] ERROR CRÍTICO iniciando el servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();