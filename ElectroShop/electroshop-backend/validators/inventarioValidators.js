const { body } = require('express-validator');
const { manejarErroresValidacion } = require('./commonValidators');

// Tipos que el controlador acepta para un ajuste manual
// (el modelo MovimientoInventario también tiene 'venta' y 'cancelacion', que son internos)
const TIPOS_AJUSTE = ['entrada', 'salida', 'ajuste'];

// POST /api/inventario/ajuste   body: { productoId, tipo, cantidad, motivo? }
const validarAjusteStock = [
  body('productoId')
    .notEmpty().withMessage('Debe indicar el producto').bail()
    .isString().withMessage('El producto indicado no es válido').bail()
    .isMongoId().withMessage('El producto indicado no es válido'),

  body('tipo')
    .notEmpty().withMessage('El tipo de movimiento es obligatorio').bail()
    .isString().withMessage('El tipo debe ser: entrada, salida o ajuste').bail()
    .isIn(TIPOS_AJUSTE).withMessage('El tipo debe ser: entrada, salida o ajuste'),

  body('cantidad')
    .notEmpty().withMessage('La cantidad es obligatoria').bail()
    .isInt({ min: 0 }).withMessage('La cantidad debe ser un número entero mayor o igual a 0'),

  body('motivo')
    .optional({ values: 'null' })
    .isString().withMessage('El motivo no es válido').bail()
    .trim()
    .isLength({ max: 300 }).withMessage('El motivo no puede exceder 300 caracteres'),

  manejarErroresValidacion
];

module.exports = { validarAjusteStock };
