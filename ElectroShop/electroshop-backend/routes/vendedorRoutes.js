const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarProducto, validarEdicionProducto } = require('../validators/productoValidators');
const { validarId, manejarErroresValidacion } = require('../validators/commonValidators');
const {
  misProductos,
  crearProducto,
  editarProducto,
  eliminarProducto,
  misVentas
} = require('../controllers/vendedorController');

// Todo el módulo requiere rol vendedor (o admin, que también puede actuar como vendedor)
router.use(protegerRuta);
router.use(autorizarRol('vendedor', 'admin'));

// Nota: vendedorController no revisa validationResult, por eso se agrega
// manejarErroresValidacion después de los validadores de producto.
router.get('/productos', misProductos);
router.post('/productos', validarProducto, manejarErroresValidacion, crearProducto);
router.put('/productos/:id', validarId(), validarEdicionProducto, manejarErroresValidacion, editarProducto);
router.delete('/productos/:id', validarId(), eliminarProducto);
router.get('/ventas', misVentas);

module.exports = router;
