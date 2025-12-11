const express = require('express');
const servicioController = require('../controllers/servicioController');
const router = express.Router();

// Rutas públicas
router.get('/', servicioController.obtenerServicios);
router.get('/categoria/:categoria', servicioController.obtenerServiciosPorCategoria);
router.get('/:id', servicioController.obtenerServicio);

// CRUD completo para administración
router.post('/', servicioController.crearServicio);
router.put('/:id', servicioController.actualizarServicio);
router.delete('/:id', servicioController.eliminarServicio);

module.exports = router;