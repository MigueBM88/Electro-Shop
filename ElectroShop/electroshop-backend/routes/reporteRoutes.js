const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const {
  resumenGeneral,
  ventasPorDia,
  productosTop,
  pedidosPorEstado
} = require('../controllers/reporteController');

// Todos los reportes son solo para admin
router.use(protegerRuta);
router.use(autorizarRol('admin'));

router.get('/resumen', resumenGeneral);
router.get('/ventas-por-dia', ventasPorDia);
router.get('/productos-top', productosTop);
router.get('/pedidos-por-estado', pedidosPorEstado);

module.exports = router;
