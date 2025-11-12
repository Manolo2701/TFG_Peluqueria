const express = require('express');
const router = express.Router();
const busquedaController = require('../controllers/busquedaController');

router.get('/global', busquedaController.buscarGlobal);
router.get('/servicios', busquedaController.buscarServicios);
router.get('/productos', busquedaController.buscarProductos);
router.get('/sugerencias', busquedaController.buscarSugerencias);
router.get('/categorias', busquedaController.obtenerCategorias);

module.exports = router;
