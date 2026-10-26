const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
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
router.get('/movimientos', historialMovimientos);
router.post('/ajuste', ajustarStock);

module.exports = router;
