const express = require('express');
const servicioController = require('../controllers/servicioController');
const router = express.Router();

// Rutas públicas
router.get('/', servicioController.obtenerServicios);
router.get('/categoria/:categoria', servicioController.obtenerServiciosPorCategoria);
router.get('/:id', servicioController.obtenerServicio);

// Ruta temporal SIN protección
router.post('/', servicioController.crearServicio);

module.exports = router;