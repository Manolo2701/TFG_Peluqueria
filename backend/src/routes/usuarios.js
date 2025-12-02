const express = require('express');
const autenticarJWT = require('../middleware/auth');
const usuarioController = require('../controllers/usuarioController');
const router = express.Router();

// Ruta pública de ejemplo
router.get('/public', (req, res) => {
  res.json({ mensaje: 'Esta es una ruta pública de usuarios' });
});

// Ruta para obtener perfil del usuario logueado
router.get('/perfil', autenticarJWT, usuarioController.obtenerPerfil);

// Ruta para actualizar perfil del usuario logueado
router.put('/perfil', autenticarJWT, usuarioController.actualizarPerfil);

// Ruta para obtener todos los usuarios (solo admin)
router.get('/', autenticarJWT, usuarioController.obtenerUsuarios);

// ✅ NUEVA: Ruta para obtener solo clientes (solo admin)
router.get('/clientes', autenticarJWT, usuarioController.obtenerClientes);

// Ruta para obtener usuario por ID
router.get('/:id', autenticarJWT, usuarioController.obtenerUsuario);

module.exports = router;