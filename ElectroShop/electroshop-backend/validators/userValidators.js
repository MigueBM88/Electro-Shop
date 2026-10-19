const { body } = require('express-validator');

const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),

  body('correo')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio')
    .isEmail().withMessage('Debe ingresar un correo electrónico válido')
    .normalizeEmail(),

  body('contrasena')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('La contraseña debe incluir al menos: una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&#)'),

  body('confirmarContrasena')
    .notEmpty().withMessage('Debe confirmar la contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.contrasena) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

const validarLogin = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo electrónico es obligatorio')
    .isEmail().withMessage('Debe ingresar un correo electrónico válido'),

  body('contrasena')
    .notEmpty().withMessage('La contraseña es obligatoria')
];

const validarEdicionPerfil = [
  body('nombre')
    .optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),

  body('telefono')
    .optional().trim()
    .matches(/^[0-9]{8}$/).withMessage('El teléfono debe tener exactamente 8 dígitos'),

  body('direccion.provincia').optional().trim().notEmpty().withMessage('La provincia no puede estar vacía'),
  body('direccion.canton').optional().trim().notEmpty().withMessage('El cantón no puede estar vacío'),
  body('direccion.distrito').optional().trim().notEmpty().withMessage('El distrito no puede estar vacío'),
  body('direccion.detalle').optional().trim().isLength({ max: 500 }).withMessage('El detalle de dirección no puede exceder 500 caracteres')
];

const validarCambioContrasena = [
  body('contrasenaActual').notEmpty().withMessage('La contraseña actual es obligatoria'),

  body('nuevaContrasena')
    .notEmpty().withMessage('La nueva contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('La contraseña debe incluir: una mayúscula, una minúscula, un número y un carácter especial'),

  body('confirmarNuevaContrasena')
    .notEmpty().withMessage('Debe confirmar la nueva contraseña')
    .custom((value, { req }) => {
      if (value !== req.body.nuevaContrasena) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

const validarCambioRol = [
  body('rol')
    .notEmpty().withMessage('El rol es obligatorio')
    .isIn(['cliente', 'admin', 'vendedor']).withMessage('El rol debe ser: cliente, admin o vendedor')
];

module.exports = {
  validarRegistro,
  validarLogin,
  validarEdicionPerfil,
  validarCambioContrasena,
  validarCambioRol
};
