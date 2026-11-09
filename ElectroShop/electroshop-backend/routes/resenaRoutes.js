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
    .isIn(['publicada', 'oculta']).withMessage('El estado indicado no es válido'),
  manejarErroresValidacion
];
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
router.get('/admin/lista', protegerRuta, autorizarRol('admin'), validarFiltroEstado, listarAdmin);
router.put('/:id/moderar', protegerRuta, autorizarRol('admin'), validarId(), validarModerarResena, moderarResena);

// Cliente autenticado
router.post('/', protegerRuta, validarCrearResena, crearResena);
router.delete('/:id', protegerRuta, validarId(), eliminarResena);

module.exports = router;
