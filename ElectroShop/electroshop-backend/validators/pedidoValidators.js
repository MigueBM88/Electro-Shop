const { body } = require('express-validator');
const { manejarErroresValidacion } = require('./commonValidators');

// Valores tomados del modelo Pedido
const METODOS_PAGO = ['tarjeta', 'sinpe', 'contra_entrega'];
const ESTADOS_PEDIDO = ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'];

// POST /api/pedidos/checkout
// body: { metodoPago?, datosPago?: { numeroTarjeta? }, direccionEnvio?: { provincia, canton, distrito, detalle } }
const validarCheckout = [
  body('metodoPago')
    .optional()
    .isString().withMessage('El método de pago debe ser: tarjeta, sinpe o contra_entrega').bail()
    .isIn(METODOS_PAGO).withMessage('El método de pago debe ser: tarjeta, sinpe o contra_entrega'),

  body('datosPago')
    .optional()
    .isObject().withMessage('Los datos de pago no son válidos'),

  body('datosPago.numeroTarjeta')
    .optional({ values: 'falsy' })
    .isString().withMessage('El número de tarjeta no es válido').bail()
    .trim()
    .matches(/^[0-9\s-]+$/).withMessage('El número de tarjeta solo puede contener dígitos')
    .isLength({ max: 23 }).withMessage('El número de tarjeta no es válido'),

  body('direccionEnvio')
    .optional({ values: 'null' })
    .isObject().withMessage('La dirección de envío no es válida'),

  body('direccionEnvio.provincia')
    .optional({ values: 'null' })
    .isString().withMessage('La provincia no es válida').bail()
    .trim().isLength({ max: 100 }).withMessage('La provincia no puede exceder 100 caracteres'),
  body('direccionEnvio.canton')
    .optional({ values: 'null' })
    .isString().withMessage('El cantón no es válido').bail()
    .trim().isLength({ max: 100 }).withMessage('El cantón no puede exceder 100 caracteres'),
  body('direccionEnvio.distrito')
    .optional({ values: 'null' })
    .isString().withMessage('El distrito no es válido').bail()
    .trim().isLength({ max: 100 }).withMessage('El distrito no puede exceder 100 caracteres'),
  body('direccionEnvio.detalle')
    .optional({ values: 'null' })
    .isString().withMessage('El detalle de dirección no es válido').bail()
    .trim().isLength({ max: 500 }).withMessage('El detalle de dirección no puede exceder 500 caracteres'),

  manejarErroresValidacion
];

// PUT /api/pedidos/:id/estado  (admin)  body: { estado, nota? }
const validarEstadoPedido = [
  body('estado')
    .notEmpty().withMessage('El estado es obligatorio').bail()
    .isString().withMessage('Estado de pedido inválido').bail()
    .isIn(ESTADOS_PEDIDO).withMessage('El estado debe ser: pendiente, pagado, preparando, enviado, entregado o cancelado'),

  body('nota')
    .optional({ values: 'null' })
    .isString().withMessage('La nota no es válida').bail()
    .trim().isLength({ max: 500 }).withMessage('La nota no puede exceder 500 caracteres'),

  manejarErroresValidacion
];

module.exports = { validarCheckout, validarEstadoPedido };
