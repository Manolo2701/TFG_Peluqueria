const express = require('express');
const {
    registrar,
    login,
    obtenerPreguntaSeguridad,
    verificarRespuestaSeguridad,
    resetearPassword
} = require('../controllers/authController');
const verificarToken = require('../middleware/auth');
const Trabajador = require('../models/Trabajador');
const router = express.Router();

// Rutas de autenticación
router.post('/registro', registrar);
router.post('/login', login);

// Rutas para recuperación de contraseña
router.post('/obtener-pregunta', obtenerPreguntaSeguridad);
router.post('/verificar-respuesta', verificarRespuestaSeguridad);
router.post('/resetear-password', resetearPassword);

// Endpoint para obtener información del usuario
router.get('/user-info', verificarToken, async (req, res) => {
    try {
        const userInfo = { ...req.usuario };

        // Si es admin, verificar si también es trabajador
        if (req.usuario.rol === 'administrador') {
            const trabajador = await Trabajador.buscarPorUsuarioId(req.usuario.id);
            userInfo.esTambienTrabajador = !!trabajador;
            if (trabajador) {
                userInfo.trabajadorId = trabajador.id;
            }
        }

        res.json(userInfo);
    } catch (error) {
        console.error('Error obteniendo info usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;