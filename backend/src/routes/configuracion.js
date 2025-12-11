const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const auth = require('../middleware/auth');

router.get('/publica', configuracionController.getConfiguracionPublica);
router.get('/categorias-especialidades', configuracionController.getCategoriasEspecialidades);

router.use(auth);

router.get('/', configuracionController.getConfiguracion);
router.get('/festivos', configuracionController.getFestivos);

router.put('/', configuracionController.updateConfiguracion);
router.put('/categorias-especialidades', configuracionController.updateCategoriasEspecialidades);
router.post('/festivos', configuracionController.addFestivo);
router.delete('/festivos/:id', configuracionController.deleteFestivo);

module.exports = router;