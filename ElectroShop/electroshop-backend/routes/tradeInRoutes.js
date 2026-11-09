const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarId } = require('../validators/commonValidators');
const { validarCrearTradeIn, validarEvaluarTradeIn } = require('../validators/tradeInValidators');
const {
  crearSolicitud,
  misSolicitudes,
  detalleSolicitud,
  listarAdmin,
  evaluarSolicitud
} = require('../controllers/tradeInController');

// Todas requieren autenticación
router.use(protegerRuta);

// Admin (antes de /:id)
router.get('/admin/lista', autorizarRol('admin'), listarAdmin);
router.put('/:id/evaluar', autorizarRol('admin'), validarId(), validarEvaluarTradeIn, evaluarSolicitud);

// Cliente
router.post('/', validarCrearTradeIn, crearSolicitud);
router.get('/mias', misSolicitudes);
router.get('/:id', validarId(), detalleSolicitud);

module.exports = router;
