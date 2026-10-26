const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarCategoria, validarEdicionCategoria } = require('../validators/categoriaValidators');
const {
  listarPrincipales,
  listarSubcategorias,
  arbolCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria
} = require('../controllers/categoriaController');

// ---- RUTAS PÚBLICAS ----
// IMPORTANTE: /arbol antes de /:id/... para que no se confunda con un id
router.get('/arbol', arbolCategorias);
router.get('/', listarPrincipales);
router.get('/:id/subcategorias', listarSubcategorias);

// ---- RUTAS ADMIN (requieren token + rol admin) ----
router.post('/', protegerRuta, autorizarRol('admin'), validarCategoria, crearCategoria);
router.put('/:id', protegerRuta, autorizarRol('admin'), validarEdicionCategoria, editarCategoria);
router.delete('/:id', protegerRuta, autorizarRol('admin'), eliminarCategoria);

module.exports = router;
