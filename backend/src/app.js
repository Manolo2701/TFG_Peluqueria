const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');
require('dotenv').config();

// DEBUG DE VARIABLES DE ENTORNO
console.log('='.repeat(50));
console.log('[ENV-DEBUG] Variables cargadas:');
console.log('[ENV-DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV-DEBUG] DOCKER_ENV:', process.env.DOCKER_ENV);
console.log('[ENV-DEBUG] SERVER_IP:', process.env.SERVER_IP || 'NO DEFINIDA');
console.log('[ENV-DEBUG] FRONTEND_URL:', process.env.FRONTEND_URL || 'NO DEFINIDA');
console.log('='.repeat(50));

const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

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

app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/auth/login') {
    console.log('[AUTH] Login request body:', req.body);
    console.log('[AUTH] Login request headers:', req.headers['content-type']);
  }
  next();
});

app.use(helmet());

// CONFIGURACIÓN CORS FINAL PARA PRODUCCIÓN DOCKER
const corsOptions = {
  origin: function (origin, callback) {
    // Si estamos en Docker en producción
    if (process.env.DOCKER_ENV === 'true' && process.env.NODE_ENV === 'production') {
      const serverIp = process.env.SERVER_IP;

      // Lista base de orígenes permitidos
      let allowedOrigins = [
        'http://nginx',
        'http://frontend',
        'http://backend:3000',
        'http://localhost',
        'http://localhost:80'
      ];

      // IP del servidor (si existe)
      if (serverIp && serverIp !== '' && serverIp !== '') {
        allowedOrigins.push(`http://${serverIp}`);
        allowedOrigins.push(`http://${serverIp}:80`);
      }

      // URLs de FRONTEND_URL
      if (process.env.FRONTEND_URL) {
        const urls = process.env.FRONTEND_URL.split(',')
          .map(url => url.trim())
          .filter(url => url && url !== 'http://');
        allowedOrigins = [...allowedOrigins, ...urls];
      }

      console.log(`[CORS] IP del servidor: ${serverIp}`);
      console.log(`[CORS] Orígenes permitidos:`, allowedOrigins);

      // Permitir peticiones sin origen (entre contenedores)
      if (!origin) {
        console.log('[CORS] Petición interna entre contenedores - PERMITIDA');
        return callback(null, true);
      }

      // Verificar si el origen está en la lista
      const isExactMatch = allowedOrigins.some(allowed => origin === allowed);
      const isLocalIp = origin.match(/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/);
      const isServerIp = serverIp && origin.startsWith(`http://${serverIp}`);

      if (isExactMatch || isLocalIp || isServerIp) {
        console.log(`[CORS] Origen permitido: ${origin}`);
        return callback(null, true);
      }

      console.log(`[CORS] Origen BLOQUEADO: ${origin}`);
      return callback(new Error('Origen no permitido'), false);
    }

    // Si no estamos en Docker o estamos en desarrollo, se permite todo
    console.log(`[CORS] Entorno no productivo - Permitido: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
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

// Endpoint de test
app.post('/test-json', (req, res) => {
  console.log('[TEST] Request body recibido:', req.body);
  console.log('[TEST] Headers:', req.headers);
  res.json({
    recibido: req.body,
    headers: req.headers,
    mensaje: 'JSON recibido correctamente'
  });
});

// Endpoint de test (UTF-8)
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

// Endpoint de monitoreo del servicio automático
app.get('/api/reservas/estado-automatico', async (req, res) => {
  try {
    const ReservaAutoService = require('./services/reservaAutoService');
    const estado = await ReservaAutoService.obtenerEstadoServicio();
    res.json(estado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de salud
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

    console.log('[SISTEMA] Inicializando sistema de cancelación...');
    const Reserva = require('./models/Reserva');
    const cancelacionSuccess = await Reserva.inicializarSistemaCancelacion();

    if (cancelacionSuccess) {
      console.log('[SISTEMA] ✅ Sistema de cancelación listo');
    } else {
      console.log('[SISTEMA] ⚠️  Sistema de cancelación con errores, pero servidor continúa');
    }

    console.log('[SISTEMA] Inicializando servicio automático de reservas...');
    const ReservaAutoService = require('./services/reservaAutoService');

    setTimeout(() => {
      ReservaAutoService.iniciar();
      console.log('[SISTEMA] ⏰ Servicio automático de reservas iniciado (setInterval)');
    }, 5000);

    process.on('uncaughtException', (error) => {
      console.error('[SISTEMA] UNCAUGHT EXCEPTION:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[SISTEMA] UNHANDLED REJECTION at:', promise, 'reason:', reason);
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log('[SISTEMA] ==========================================');
      console.log('[SISTEMA] 🚀 Servidor corriendo en puerto ' + PORT);
      console.log(`[SISTEMA] 🌐 Entorno: ${process.env.NODE_ENV}`);
      console.log(`[SISTEMA] 📍 IP del servidor: ${process.env.SERVER_IP || 'No configurada'}`);
      console.log('[SISTEMA] ✅ CORS configurado para entornos dockerizados');
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

startServer();