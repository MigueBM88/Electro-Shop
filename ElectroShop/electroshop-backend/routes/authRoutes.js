const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middlewares/auth');
const {
  validarRegistro,
  validarLogin,
  validarEdicionPerfil,
  validarCambioContrasena
} = require('../validators/userValidators');
const {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  editarPerfil,
  cambiarContrasena,
  confirmarCorreo
} = require('../controllers/authController');

// RUTAS PÚBLICAS
router.post('/registro', validarRegistro, registrarUsuario);
router.post('/login', validarLogin, iniciarSesion);
router.get('/confirmar-correo/:token', confirmarCorreo);

// RUTAS PROTEGIDAS
router.get('/perfil', protegerRuta, obtenerPerfil);
router.put('/perfil', protegerRuta, validarEdicionPerfil, editarPerfil);
router.put('/cambiar-contrasena', protegerRuta, validarCambioContrasena, cambiarContrasena);

module.exports = router;
