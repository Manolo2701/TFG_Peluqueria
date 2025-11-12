const express = require('express');
const autenticarJWT = require('../middleware/auth');
const usuarioController = require('../controllers/usuarioController');
const router = express.Router();

// Ruta pública de ejemplo
router.get('/public', (req, res) => {
  res.json({ mensaje: 'Esta es una ruta pública de usuarios' });
});

// Ruta para obtener perfil del usuario logueado
router.get('/perfil', autenticarJWT, usuarioController.obtenerPerfil); // USAR CONTROLADOR

// Ruta para obtener todos los usuarios (solo admin)
router.get('/', autenticarJWT, usuarioController.obtenerUsuarios);

// Ruta para obtener usuario por ID
router.get('/:id', autenticarJWT, usuarioController.obtenerUsuario);

module.exports = router;