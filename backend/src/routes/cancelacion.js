const express = require('express');
const router = express.Router();
const cancelacionController = require('../controllers/cancelacionController');
const verificarToken = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Cancelar reserva
router.put('/:id/cancelar', cancelacionController.cancelarReserva);

// Obtener políticas de cancelación
router.get('/politicas', cancelacionController.obtenerPoliticas);

// Obtener detalles de cancelación de una reserva
router.get('/:id/detalles', cancelacionController.obtenerDetallesCancelacion);

module.exports = router;