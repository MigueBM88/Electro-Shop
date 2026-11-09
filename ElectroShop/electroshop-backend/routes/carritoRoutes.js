const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { validarId } = require('../validators/commonValidators');
const { validarAgregarItem, validarActualizarItem } = require('../validators/carritoValidators');
const {
  obtenerCarrito,
  agregarItem,
  actualizarItem,
  eliminarItem,
  vaciarCarrito
} = require('../controllers/carritoController');

// Todas las rutas del carrito requieren usuario autenticado
router.use(protegerRuta);

router.get('/', obtenerCarrito);
router.post('/items', validarAgregarItem, agregarItem);
router.put('/items/:productoId', validarId('productoId'), validarActualizarItem, actualizarItem);
router.delete('/items/:productoId', validarId('productoId'), eliminarItem);
router.delete('/', vaciarCarrito);

module.exports = router;
