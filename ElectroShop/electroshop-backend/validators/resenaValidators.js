const { body } = require('express-validator');
const { manejarErroresValidacion } = require('./commonValidators');

// Valores tomados del modelo Resena
const ESTADOS_RESENA = ['publicada', 'oculta'];

// POST /api/resenas   body: { productoId, calificacion, comentario? }
const validarCrearResena = [
  body('productoId')
    .notEmpty().withMessage('Debe indicar el producto').bail()
    .isString().withMessage('El producto indicado no es válido').bail()
    .isMongoId().withMessage('El producto indicado no es válido'),

  body('calificacion')
    .notEmpty().withMessage('La calificación es obligatoria').bail()
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5'),

  body('comentario')
    .optional({ values: 'null' })
    .isString().withMessage('El comentario no es válido').bail()
    .trim()
    .isLength({ max: 1000 }).withMessage('El comentario no puede exceder 1000 caracteres'),

  manejarErroresValidacion
];

// PUT /api/resenas/:id/moderar  (admin)  body: { estado: 'publicada' | 'oculta' }
const validarModerarResena = [
  body('estado')
    .notEmpty().withMessage('El estado es obligatorio').bail()
    .isString().withMessage('Estado inválido').bail()
    .isIn(ESTADOS_RESENA).withMessage('El estado debe ser: publicada u oculta'),

  manejarErroresValidacion
];

module.exports = { validarCrearResena, validarModerarResena };
