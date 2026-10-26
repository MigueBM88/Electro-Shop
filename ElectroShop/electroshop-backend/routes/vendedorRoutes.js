const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarProducto, validarEdicionProducto } = require('../validators/productoValidators');
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

router.get('/productos', misProductos);
router.post('/productos', validarProducto, crearProducto);
router.put('/productos/:id', validarEdicionProducto, editarProducto);
router.delete('/productos/:id', eliminarProducto);
router.get('/ventas', misVentas);

module.exports = router;
