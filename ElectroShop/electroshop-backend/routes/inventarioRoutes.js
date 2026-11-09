const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarAjusteStock } = require('../validators/inventarioValidators');
const { validarQueryIds } = require('../validators/commonValidators');
const {
  resumenInventario,
  alertasStock,
  ajustarStock,
  historialMovimientos
} = require('../controllers/inventarioController');

// Todo el módulo de inventario es solo para admin
router.use(protegerRuta);
router.use(autorizarRol('admin'));

router.get('/resumen', resumenInventario);
router.get('/alertas', alertasStock);
router.get('/movimientos', validarQueryIds('productoId'), historialMovimientos);
router.post('/ajuste', validarAjusteStock, ajustarStock);

module.exports = router;
