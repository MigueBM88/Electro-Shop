const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const {
  checkout,
  misPedidos,
  detallePedido,
  cancelarPedido,
  listarPedidosAdmin,
  actualizarEstadoPedido
} = require('../controllers/pedidoController');

// Todas las rutas de pedidos requieren autenticación
router.use(protegerRuta);

// ---- Rutas ADMIN (van antes de /:id para no colisionar) ----
router.get('/admin/lista', autorizarRol('admin'), listarPedidosAdmin);
router.put('/:id/estado', autorizarRol('admin'), actualizarEstadoPedido);

// ---- Rutas del CLIENTE ----
router.post('/checkout', checkout);
router.get('/', misPedidos);
router.get('/:id', detallePedido);
router.put('/:id/cancelar', cancelarPedido);

module.exports = router;
