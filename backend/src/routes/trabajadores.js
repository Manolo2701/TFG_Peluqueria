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

            // Buscar el trabajador_id correspondiente
            const trabajador = await Trabajador.buscarPorUsuarioId(req.usuario.id);
            if (trabajador) {
                console.log(`✅ [MIDDLEWARE] Trabajador encontrado: ID ${trabajador.id}`);
                req.usuario.trabajadorId = trabajador.id;
            } else {
                console.log('❌ [MIDDLEWARE] No se encontró perfil de trabajador para usuario trabajador');
                return res.status(403).json({ error: 'Perfil de trabajador no encontrado' });
            }
            return next();
        }

        // SI es admin, verificar si también es trabajador
        if (req.usuario.rol === 'administrador') {
            console.log('🔍 [MIDDLEWARE] Verificando si admin es también trabajador...');
            const trabajador = await Trabajador.buscarPorUsuarioId(req.usuario.id);
            if (trabajador) {
                console.log(`✅ [MIDDLEWARE] Admin es también trabajador, ID: ${trabajador.id}`);
                req.usuario.trabajadorId = trabajador.id;
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

// ✅ SOLO UN middleware de verificación - ELIMINA EL MIDDLEWARE ANTIGUO
router.use(verificarToken);
router.use(verificarTrabajador); // ← Este debe ser el ÚNICO middleware después de verificarToken

// Las rutas permanecen igual
router.get('/mis-reservas', trabajadorController.obtenerMisReservas);
router.get('/reservas-disponibles', trabajadorController.obtenerReservasDisponibles);
router.put('/reservas/:id/tomar', trabajadorController.tomarReserva);
router.put('/reservas/:id/aceptar', trabajadorController.aceptarReserva);
router.put('/reservas/:id/rechazar', trabajadorController.rechazarReserva);

module.exports = router;