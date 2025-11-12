const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypalController');

router.post('/crear-orden', paypalController.crearOrden);
router.post('/capturar-pago', paypalController.capturarPago);
router.get('/exito', paypalController.exito);
router.get('/cancelar', paypalController.cancelar);

module.exports = router;
