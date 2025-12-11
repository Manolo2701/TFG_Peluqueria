const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendarioController');
const verificarToken = require('../middleware/auth');
const Trabajador = require('../models/Trabajador');

// Middleware para verificar si es trabajador O admin híbrido
const verificarTrabajador = async (req, res, next) => {
    try {
        console.log(`🔍 [CALENDARIO] Verificando acceso para usuario: ${req.usuario.id}, rol: ${req.usuario.rol}`);

        if (req.usuario.rol === 'trabajador') {
            console.log('✅ [CALENDARIO] Acceso concedido: es trabajador');
            return next();
        }

        if (req.usuario.rol === 'administrador') {
            console.log('🔍 [CALENDARIO] Verificando si admin es también trabajador...');
            const trabajador = await Trabajador.buscarPorUsuarioId(req.usuario.id);
            if (trabajador) {
                console.log(`✅ [CALENDARIO] Admin es también trabajador, ID: ${trabajador.id}`);
                req.usuario.trabajadorId = trabajador.id;
                return next();
            } else {
                console.log('❌ [CALENDARIO] Admin no está registrado como trabajador');
            }
        }

        console.log('❌ [CALENDARIO] Acceso denegado');
        return res.status(403).json({ error: 'Acceso solo para trabajadores' });
    } catch (error) {
        console.error('Error en verificarTrabajador (calendario):', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Rutas públicas
router.get('/disponibilidad', calendarioController.obtenerDisponibilidad);
router.get('/disponibilidad-rapida', calendarioController.obtenerDisponibilidadRapida);

// Rutas protegidas para trabajadores y admin híbridos
router.get('/mi-calendario', verificarToken, verificarTrabajador, calendarioController.obtenerMiCalendario);
router.post('/solicitar-ausencia', verificarToken, verificarTrabajador, calendarioController.solicitarAusencia);

// Rutas de admin 
router.get('/ausencias', verificarToken, calendarioController.obtenerTodasAusencias);
router.put('/ausencias/:id/gestionar', verificarToken, calendarioController.gestionarAusencia);

// Obtener mis ausencias
router.get('/mis-ausencias', verificarToken, verificarTrabajador, calendarioController.obtenerMisAusencias);

module.exports = router;