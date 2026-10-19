const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarCambioRol } = require('../validators/userValidators');
const {
  listarUsuarios,
  obtenerUsuario,
  cambiarRolUsuario,
  desactivarUsuario,
  reactivarUsuario
} = require('../controllers/adminUserController');

// Todas las rutas requieren autenticación + rol admin
router.use(protegerRuta);
router.use(autorizarRol('admin'));

router.get('/', listarUsuarios);
router.get('/:id', obtenerUsuario);
router.put('/:id/rol', validarCambioRol, cambiarRolUsuario);
router.put('/:id/desactivar', desactivarUsuario);
router.put('/:id/reactivar', reactivarUsuario);

module.exports = router;
