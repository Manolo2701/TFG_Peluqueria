const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener estadísticas del dashboard
router.get('/estadisticas', dashboardController.getEstadisticas);

// NUEVA RUTA: Estadísticas específicas para trabajador
router.get('/estadisticas-trabajador', dashboardController.getEstadisticasTrabajador);

module.exports = router;