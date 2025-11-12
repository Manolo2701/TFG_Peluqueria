const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const auth = require('../middleware/auth');

// 🔓 RUTA PÚBLICA - SIN AUTENTICACIÓN (debe estar ANTES del middleware auth)
router.get('/publica', configuracionController.getConfiguracionPublica);

// 🔐 Todas las demás rutas requieren autenticación
router.use(auth);

// Rutas para usuarios autenticados
router.get('/', configuracionController.getConfiguracion);
router.get('/festivos', configuracionController.getFestivos);

// Rutas solo para administradores
router.put('/', configuracionController.updateConfiguracion);
router.post('/festivos', configuracionController.addFestivo);
router.delete('/festivos/:id', configuracionController.deleteFestivo);

module.exports = router;