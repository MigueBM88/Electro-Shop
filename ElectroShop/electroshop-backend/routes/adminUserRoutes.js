const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const { autorizarRol } = require('../middlewares/roleAuth');
const { validarCambioRol } = require('../validators/userValidators');
const { validarId } = require('../validators/commonValidators');
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
router.get('/:id', validarId(), obtenerUsuario);
router.put('/:id/rol', validarId(), validarCambioRol, cambiarRolUsuario);
router.put('/:id/desactivar', validarId(), desactivarUsuario);
router.put('/:id/reactivar', validarId(), reactivarUsuario);

module.exports = router;
