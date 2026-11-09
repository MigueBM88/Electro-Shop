const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarId } = require('../validators/commonValidators');
const { validarCrearResena, validarModerarResena } = require('../validators/resenaValidators');
const {
  listarPorProducto,
  crearResena,
  eliminarResena,
  listarAdmin,
  moderarResena
} = require('../controllers/resenaController');

// Público: ver reseñas de un producto
router.get('/producto/:productoId', validarId('productoId'), listarPorProducto);

// Admin (antes de /:id)
router.get('/admin/lista', protegerRuta, autorizarRol('admin'), listarAdmin);
router.put('/:id/moderar', protegerRuta, autorizarRol('admin'), validarId(), validarModerarResena, moderarResena);

// Cliente autenticado
router.post('/', protegerRuta, validarCrearResena, crearResena);
router.delete('/:id', protegerRuta, validarId(), eliminarResena);

module.exports = router;
