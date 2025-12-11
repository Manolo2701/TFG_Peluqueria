const express = require('express');
const verificarToken = require('../middleware/auth');
const usuarioController = require('../controllers/usuarioController');
const router = express.Router();

// Ruta pública de ejemplo
router.get('/public', (req, res) => {
  res.json({ mensaje: 'Esta es una ruta pública de usuarios' });
});

// Ruta para obtener perfil del usuario logueado
router.get('/perfil', verificarToken, usuarioController.obtenerPerfil);

// Ruta para actualizar perfil del usuario logueado
router.put('/perfil', verificarToken, usuarioController.actualizarPerfil);

// Ruta para obtener todos los usuarios (solo admin)
router.get('/', verificarToken, usuarioController.obtenerUsuarios);

// Ruta para obtener solo clientes (solo admin)
router.get('/clientes', verificarToken, usuarioController.obtenerClientes);

// Ruta para obtener usuario por ID
router.get('/:id', verificarToken, usuarioController.obtenerUsuario);

// Ruta para obtener el historial de los clientes (solo admin)
router.get('/:id/historial', verificarToken, usuarioController.obtenerHistorialClienteAdmin);

module.exports = router;