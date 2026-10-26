const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarProducto, validarEdicionProducto } = require('../validators/productoValidators');
const {
  productosPorCategoria,
  buscarProductos,
  listarMarcas,
  detalleProducto,
  listarProductosAdmin,
  crearProducto,
  editarProducto,
  eliminarProducto
} = require('../controllers/productoController');

// ============================================
// RUTAS PÚBLICAS
// IMPORTANTE: las rutas específicas van ANTES de /:id
// para que Express no interprete 'buscar', 'marcas', etc. como un id.
// ============================================
router.get('/buscar', buscarProductos);
router.get('/marcas', listarMarcas);
router.get('/categoria/:catId', productosPorCategoria);

// ============================================
// RUTAS ADMIN (requieren token + rol admin)
// /admin/lista va antes de /:id
// ============================================
router.get('/admin/lista', protegerRuta, autorizarRol('admin'), listarProductosAdmin);

// Detalle público por id (debe ir después de las rutas específicas)
router.get('/:id', detalleProducto);

// CRUD admin
router.post('/', protegerRuta, autorizarRol('admin'), validarProducto, crearProducto);
router.put('/:id', protegerRuta, autorizarRol('admin'), validarEdicionProducto, editarProducto);
router.delete('/:id', protegerRuta, autorizarRol('admin'), eliminarProducto);

module.exports = router;
