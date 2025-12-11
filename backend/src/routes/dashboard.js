const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Autenticación
router.use(auth);

// Obtener estadísticas del dashboard
router.get('/estadisticas', dashboardController.getEstadisticas);

// Estadísticas específicas para trabajador
router.get('/estadisticas-trabajador', dashboardController.getEstadisticasTrabajador);

module.exports = router;