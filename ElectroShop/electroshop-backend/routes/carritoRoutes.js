const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
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
router.post('/items', agregarItem);
router.put('/items/:productoId', actualizarItem);
router.delete('/items/:productoId', eliminarItem);
router.delete('/', vaciarCarrito);

module.exports = router;
