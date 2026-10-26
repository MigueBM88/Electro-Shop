const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
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
router.put('/:id/evaluar', autorizarRol('admin'), evaluarSolicitud);

// Cliente
router.post('/', crearSolicitud);
router.get('/mias', misSolicitudes);
router.get('/:id', detalleSolicitud);

module.exports = router;
