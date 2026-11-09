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
    .isIn(['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado']).withMessage('El estado indicado no es válido'),
  manejarErroresValidacion
];
const { validarCheckout, validarEstadoPedido } = require('../validators/pedidoValidators');
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
router.get('/admin/lista', autorizarRol('admin'), validarFiltroEstado, listarPedidosAdmin);
router.put('/:id/estado', autorizarRol('admin'), validarId(), validarEstadoPedido, actualizarEstadoPedido);

// ---- Rutas del CLIENTE ----
router.post('/checkout', validarCheckout, checkout);
router.get('/', validarFiltroEstado, misPedidos);
router.get('/:id', validarId(), detallePedido);
router.put('/:id/cancelar', validarId(), cancelarPedido);

module.exports = router;
