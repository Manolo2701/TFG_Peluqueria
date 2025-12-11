const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajadorController');
const verificarToken = require('../middleware/auth');
const Trabajador = require('../models/Trabajador');

// Middleware para verificar si es trabajador O admin híbrido
const verificarTrabajador = async (req, res, next) => {
    try {
        console.log(`🔍 [MIDDLEWARE] Verificando acceso para usuario: ${req.usuario.id}, rol: ${req.usuario.rol}, nombre: ${req.usuario.nombre}`);

        // Si es trabajador, permitir acceso directamente
        if (req.usuario.rol === 'trabajador') {
            console.log('✅ [MIDDLEWARE] Acceso concedido: es trabajador');

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

        // Si es admin, verificar si también es trabajador
        if (req.usuario.rol === 'administrador') {
            console.log('🔍 [MIDDLEWARE] Verificando si admin es también trabajador...');
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

// Verificar si es administrador
const verificarAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'administrador') {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
    next();
};

// Verificar si es admin o trabajador (rutas de gestión)
const verificarAdminOTrabajador = (req, res, next) => {
    if (req.usuario.rol !== 'administrador' && req.usuario.rol !== 'trabajador') {
        return res.status(403).json({
            error: 'Acceso denegado. Se requieren permisos de administrador o trabajador.'
        });
    }
    next();
};

// Verificar si un usuario tiene perfil de trabajador
router.get('/verificar-perfil/:usuarioId', verificarToken, async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const usuarioAutenticado = req.usuario;


        if (usuarioAutenticado.id != usuarioId && usuarioAutenticado.rol !== 'administrador') {
            return res.status(403).json({ error: 'No autorizado para verificar este perfil' });
        }

        console.log(`🔍 [RUTA] Verificando perfil de trabajador para usuario: ${usuarioId}`);

        const trabajador = await Trabajador.obtenerPorUsuarioId(usuarioId);
        const tienePerfil = !!trabajador;

        console.log(`✅ [RUTA] Usuario ${usuarioId} ${tienePerfil ? 'TIENE' : 'NO TIENE'} perfil de trabajador`);

        res.json({
            tienePerfil: tienePerfil,
            trabajador: trabajador || null
        });
    } catch (error) {
        console.error('❌ Error en /verificar-perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.use(verificarToken);

// ============================================
// RUTAS DE ADMINISTRADOR (deben estar PRIMERO)
// ============================================
router.post('/admin', verificarAdmin, trabajadorController.crearTrabajador);
router.get('/admin/:id', verificarAdmin, trabajadorController.obtenerTrabajador);
router.put('/admin/:id', verificarAdmin, trabajadorController.actualizarTrabajador);
router.delete('/admin/:id', verificarAdmin, trabajadorController.eliminarTrabajador);

// ============================================
// RUTAS DE GESTIÓN (Admin y Trabajadores)
// ============================================

// Listar todos los trabajadores
router.get('/', verificarAdminOTrabajador, trabajadorController.obtenerTrabajadores);

// ============================================
// RUTAS PERSONALES DE TRABAJADOR (requieren perfil)
// ============================================
router.use(verificarTrabajador);

// Rutas que requieren ser trabajador (con perfil)
router.get('/mis-reservas', trabajadorController.obtenerMisReservas);
router.get('/mis-clientes', trabajadorController.obtenerMisClientes);
router.get('/mis-clientes/:clienteId/historial', trabajadorController.obtenerHistorialCliente);
router.get('/reservas-disponibles', trabajadorController.obtenerReservasDisponibles);
router.put('/reservas/:id/tomar', trabajadorController.tomarReserva);
router.put('/reservas/:id/aceptar', trabajadorController.aceptarReserva);
router.put('/reservas/:id/rechazar', trabajadorController.rechazarReserva);

module.exports = router;