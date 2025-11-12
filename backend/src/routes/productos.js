const express = require('express');
const productoController = require('../controllers/productoController');
const router = express.Router();

// Rutas públicas para productos
router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProducto);

module.exports = router;