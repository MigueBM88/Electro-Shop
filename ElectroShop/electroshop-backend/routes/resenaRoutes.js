const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const {
  listarPorProducto,
  crearResena,
  eliminarResena,
  listarAdmin,
  moderarResena
} = require('../controllers/resenaController');

// Público: ver reseñas de un producto
router.get('/producto/:productoId', listarPorProducto);

// Admin (antes de /:id)
router.get('/admin/lista', protegerRuta, autorizarRol('admin'), listarAdmin);
router.put('/:id/moderar', protegerRuta, autorizarRol('admin'), moderarResena);

// Cliente autenticado
router.post('/', protegerRuta, crearResena);
router.delete('/:id', protegerRuta, eliminarResena);

module.exports = router;
