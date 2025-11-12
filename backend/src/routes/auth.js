const express = require('express');
const { registrar, login } = require('../controllers/authController');
const verificarToken = require('../middleware/auth');
const Trabajador = require('../models/Trabajador');
const router = express.Router();

router.post('/registro', registrar);
router.post('/login', login);

// Nuevo endpoint para obtener información del usuario (incluye si es trabajador)
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