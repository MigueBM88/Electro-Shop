const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { query } = require('express-validator');
const { validarId, manejarErroresValidacion } = require('../validators/commonValidators');

// ?estado= opcional: texto simple y uno de los valores del modelo
const validarFiltroEstado = [
  query('estado').optional({ values: 'falsy' })
    .isString().withMessage('El filtro de estado no es válido').bail()
    .isIn(['solicitado', 'en_revision', 'aprobado', 'rechazado', 'contraoferta']).withMessage('El estado indicado no es válido'),
  manejarErroresValidacion
];
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
router.get('/admin/lista', autorizarRol('admin'), validarFiltroEstado, listarAdmin);
router.put('/:id/evaluar', autorizarRol('admin'), validarId(), validarEvaluarTradeIn, evaluarSolicitud);

// Cliente
router.post('/', validarCrearTradeIn, crearSolicitud);
router.get('/mias', misSolicitudes);
router.get('/:id', validarId(), detalleSolicitud);

module.exports = router;
