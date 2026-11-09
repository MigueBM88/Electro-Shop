const { body } = require('express-validator');
const { manejarErroresValidacion } = require('./commonValidators');

// POST /api/carrito/items   body: { productoId, cantidad }
const validarAgregarItem = [
  body('productoId')
    .notEmpty().withMessage('Debe indicar el producto').bail()
    .isString().withMessage('El producto indicado no es válido').bail()
    .isMongoId().withMessage('El producto indicado no es válido'),

  // Opcional: el controlador usa 1 por defecto si no viene
  body('cantidad')
    .optional({ values: 'null' })
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),

  manejarErroresValidacion
];

// PUT /api/carrito/items/:productoId   body: { cantidad }
const validarActualizarItem = [
  body('cantidad')
    .notEmpty().withMessage('La cantidad es obligatoria').bail()
    .isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),

  manejarErroresValidacion
];

module.exports = { validarAgregarItem, validarActualizarItem };
