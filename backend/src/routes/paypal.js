const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypalController');
const verificarToken = require('../middleware/auth');

router.post('/crear-orden', verificarToken, paypalController.crearOrden);
router.post('/capturar-pago', verificarToken, paypalController.capturarPago);

router.get('/exito', paypalController.exito);
router.get('/cancelar', paypalController.cancelar);

module.exports = router;