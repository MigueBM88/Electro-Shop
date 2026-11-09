const { body } = require('express-validator');
const { manejarErroresValidacion } = require('./commonValidators');

// Valores tomados del modelo TradeIn
const CONDICIONES = ['excelente', 'bueno', 'regular', 'para_repuestos'];
// El controlador solo permite evaluar a estos estados ('solicitado' es el estado inicial)
const ESTADOS_EVALUACION = ['en_revision', 'aprobado', 'rechazado', 'contraoferta'];

// POST /api/tradein
// body: { nombreEquipo, descripcion, condicionDeclarada?, imagenesUrls?, precioEstimadoCliente? }
const validarCrearTradeIn = [
  body('nombreEquipo')
    .notEmpty().withMessage('El nombre del equipo es obligatorio').bail()
    .isString().withMessage('El nombre del equipo no es válido').bail()
    .trim()
    .notEmpty().withMessage('El nombre del equipo es obligatorio')
    .isLength({ max: 150 }).withMessage('El nombre del equipo no puede exceder 150 caracteres'),

  body('descripcion')
    .notEmpty().withMessage('La descripción es obligatoria').bail()
    .isString().withMessage('La descripción no es válida').bail()
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),

  // Opcional: el controlador usa 'bueno' por defecto
  body('condicionDeclarada')
    .optional({ values: 'falsy' })
    .isString().withMessage('La condición debe ser: excelente, bueno, regular o para_repuestos').bail()
    .isIn(CONDICIONES).withMessage('La condición debe ser: excelente, bueno, regular o para_repuestos'),

  body('imagenesUrls')
    .optional({ values: 'null' })
    .isArray({ max: 10 }).withMessage('Las imágenes deben enviarse como una lista (máximo 10)'),

  body('imagenesUrls.*')
    .isString().withMessage('Cada imagen debe ser una URL válida').bail()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Cada imagen debe ser una URL válida (http/https)'),

  body('precioEstimadoCliente')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 }).withMessage('El precio estimado debe ser un número mayor o igual a 0'),

  manejarErroresValidacion
];

// PUT /api/tradein/:id/evaluar  (admin)  body: { estado, ofertaAdmin?, notaAdmin? }
const validarEvaluarTradeIn = [
  body('estado')
    .notEmpty().withMessage('El estado es obligatorio').bail()
    .isString().withMessage('Estado de evaluación inválido').bail()
    .isIn(ESTADOS_EVALUACION).withMessage('El estado debe ser: en_revision, aprobado, rechazado o contraoferta'),

  // '' y null se ignoran (el controlador no modifica la oferta en ese caso)
  body('ofertaAdmin')
    .optional({ values: 'null' })
    .if((value) => value !== '')
    .isFloat({ min: 0 }).withMessage('La oferta debe ser un número mayor o igual a 0'),

  body('notaAdmin')
    .optional({ values: 'null' })
    .isString().withMessage('La nota no es válida').bail()
    .trim()
    .isLength({ max: 1000 }).withMessage('La nota no puede exceder 1000 caracteres'),

  manejarErroresValidacion
];

module.exports = { validarCrearTradeIn, validarEvaluarTradeIn };
