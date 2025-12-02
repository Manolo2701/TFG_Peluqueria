const express = require('express');
const productoController = require('../controllers/productoController');
const router = express.Router();

// Rutas públicas para productos
router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProducto);

// ✅ RUTAS NUEVAS: CRUD completo para administración
router.post('/', productoController.crearProducto);
router.put('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);

module.exports = router;