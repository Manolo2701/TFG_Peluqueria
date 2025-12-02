const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajadorController');
const verificarToken = require('../middleware/auth');
const Trabajador = require('../models/Trabajador');

// Middleware para verificar si es trabajador O admin que también es trabajador
const verificarTrabajador = async (req, res, next) => {
    try {
        console.log(`🔍 [MIDDLEWARE] Verificando acceso para usuario: ${req.usuario.id}, rol: ${req.usuario.rol}, nombre: ${req.usuario.nombre}`);

        // SI es trabajador, permitir acceso directamente
        if (req.usuario.rol === 'trabajador') {
            console.log('✅ [MIDDLEWARE] Acceso concedido: es trabajador');

            // ✅ USAR LA NUEVA FUNCIÓN
            const trabajador = await Trabajador.obtenerPorUsuarioId(req.usuario.id);
            if (trabajador) {
                console.log(`✅ [MIDDLEWARE] Trabajador encontrado: ID ${trabajador.trabajador_id}`);
                req.usuario.trabajadorId = trabajador.trabajador_id;
            } else {
                console.log('❌ [MIDDLEWARE] No se encontró perfil de trabajador para usuario trabajador');
                return res.status(403).json({ error: 'Perfil de trabajador no encontrado' });
            }
            return next();
        }

        // SI es admin, verificar si también es trabajador
        if (req.usuario.rol === 'administrador') {
            console.log('🔍 [MIDDLEWARE] Verificando si admin es también trabajador...');
            // ✅ USAR LA NUEVA FUNCIÓN
            const trabajador = await Trabajador.obtenerPorUsuarioId(req.usuario.id);
            if (trabajador) {
                console.log(`✅ [MIDDLEWARE] Admin es también trabajador, ID: ${trabajador.trabajador_id}`);
                req.usuario.trabajadorId = trabajador.trabajador_id;
                return next();
            } else {
                console.log('❌ [MIDDLEWARE] Admin no está registrado como trabajador');
                return res.status(403).json({ error: 'Acceso solo para trabajadores' });
            }
        }

        console.log('❌ [MIDDLEWARE] Acceso denegado: rol no autorizado:', req.usuario.rol);
        return res.status(403).json({ error: 'Acceso solo para trabajadores' });
    } catch (error) {
        console.error('❌ [MIDDLEWARE] Error en verificarTrabajador:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// ✅ MIDDLEWARE SIMPLE PARA VERIFICAR ADMIN
const verificarAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'administrador') {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
    next();
};

// ✅ RUTAS EXISTENTES (solo para trabajadores)
router.use(verificarToken);
router.use(verificarTrabajador);

// Las rutas existentes permanecen igual
router.get('/mis-reservas', trabajadorController.obtenerMisReservas);
router.get('/mis-clientes', trabajadorController.obtenerMisClientes);
router.get('/mis-clientes/:clienteId/historial', trabajadorController.obtenerHistorialCliente);
router.get('/reservas-disponibles', trabajadorController.obtenerReservasDisponibles);
router.put('/reservas/:id/tomar', trabajadorController.tomarReserva);
router.put('/reservas/:id/aceptar', trabajadorController.aceptarReserva);
router.put('/reservas/:id/rechazar', trabajadorController.rechazarReserva);
router.get('/', trabajadorController.obtenerTrabajadores);

// ✅ NUEVAS RUTAS DE ADMINISTRADOR (solo admin)
router.post('/admin', verificarToken, verificarAdmin, (req, res, next) => {
    console.log('📝 [RUTA] Creando nuevo trabajador');
    next();
}, trabajadorController.crearTrabajador);

router.get('/admin/:id', verificarToken, verificarAdmin, (req, res, next) => {
    console.log(`🔍 [RUTA] Obteniendo trabajador ID: ${req.params.id}`);
    next();
}, trabajadorController.obtenerTrabajador);

router.put('/admin/:id', verificarToken, verificarAdmin, (req, res, next) => {
    console.log(`✏️ [RUTA] Actualizando trabajador ID: ${req.params.id}`);
    next();
}, trabajadorController.actualizarTrabajador);

router.delete('/admin/:id', verificarToken, verificarAdmin, (req, res, next) => {
    console.log(`🗑️ [RUTA] Eliminando trabajador ID: ${req.params.id}`);
    next();
}, trabajadorController.eliminarTrabajador);

module.exports = router;