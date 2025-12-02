const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const productoController = require('../controllers/productoController');
const carritoController = require('../controllers/carritoController');
const verificarToken = require('../middleware/auth');

// Rutas públicas para productos
router.get('/productos', productoController.obtenerProductos);
router.get('/productos/:id', productoController.obtenerProducto);

// Rutas protegidas para carrito
router.post('/carrito/agregar', verificarToken, carritoController.agregarAlCarrito);
router.get('/carrito', verificarToken, carritoController.obtenerCarrito);
router.delete('/carrito/vaciar', verificarToken, carritoController.vaciarCarrito);
router.get('/carrito/verificar-stock', verificarToken, carritoController.verificarStock);
router.put('/carrito/actualizar', verificarToken, carritoController.actualizarCantidad);

// Rutas protegidas para ventas
router.post('/procesar', verificarToken, ventaController.procesarVenta);
router.get('/mis-ventas', verificarToken, ventaController.obtenerMisVentas);

router.get('/:id', verificarToken, ventaController.obtenerVentaPorId);
router.get('/transaccion/:transaccionId', verificarToken, ventaController.obtenerVentaPorTransaccion);

module.exports = router;