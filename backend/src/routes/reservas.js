const express = require('express');
const reservaController = require('../controllers/reservaController');
const notasController = require('../controllers/notasController');
const verificarToken = require('../middleware/auth');
const router = express.Router();

// Autenticación
router.use(verificarToken);

// Rutas específicas
router.get('/mis-reservas', reservaController.obtenerMisReservas);
router.post('/crear', reservaController.crearReserva);
router.get('/trabajadores-disponibles', reservaController.obtenerTrabajadoresDisponibles);
router.get('/servicio/:servicio_id/trabajadores', reservaController.obtenerTrabajadoresParaServicio);

// Rutas dinámicas
router.get('/:id/notas-internas', notasController.obtenerNotasInternas);
router.put('/:id/notas-internas', notasController.actualizarNotasInternas);
router.get('/:id', reservaController.obtenerReserva);

// Ruta para administradores
router.get('/', reservaController.obtenerReservas);

module.exports = router;