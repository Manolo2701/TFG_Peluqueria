const express = require('express');
const reservaController = require('../controllers/reservaController');
const notasController = require('../controllers/notasController');
const verificarToken = require('../middleware/auth');
const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// RUTAS ESPECÍFICAS PRIMERO (antes de las dinámicas)
router.get('/mis-reservas', reservaController.obtenerMisReservas);
router.post('/crear', reservaController.crearReserva);
router.get('/trabajadores-disponibles', reservaController.obtenerTrabajadoresDisponibles);
router.get('/servicio/:servicio_id/trabajadores', reservaController.obtenerTrabajadoresParaServicio);

// RUTAS DINÁMICAS DESPUÉS
router.get('/:id/notas-internas', notasController.obtenerNotasInternas);
router.put('/:id/notas-internas', notasController.actualizarNotasInternas);
router.get('/:id', reservaController.obtenerReserva);

// Solo administradores (última)
router.get('/', reservaController.obtenerReservas);

module.exports = router;