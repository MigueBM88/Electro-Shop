const { param, query, validationResult } = require('express-validator');

// Middleware compartido: corta la petición con 400 si hubo errores de validación.
// Mantiene el mismo formato que usan los controladores (erroresValidacion):
// { exito: false, mensaje: 'Error de validación', errores: [{ campo, mensaje }] }
const manejarErroresValidacion = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      exito: false,
      mensaje: errores.array()[0].msg || 'Error de validación',
      errores: errores.array().map((err) => ({ campo: err.path, mensaje: err.msg }))
    });
  }
  next();
};

// Valida que un parámetro de ruta sea un ObjectId de MongoDB válido
// Uso: router.get('/:id', validarId(), controlador)  |  validarId('productoId')
const validarId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage('El identificador indicado no es válido'),
  manejarErroresValidacion
];

// Filtros opcionales de query que deben ser ObjectId (?categoria=, ?productoId=).
// Vacío se permite; también bloquea objetos como ?categoria[$ne]=x
const validarQueryIds = (...nombres) => [
  ...nombres.map((n) =>
    query(n)
      .optional({ values: 'falsy' })
      .isString().withMessage(`El filtro '${n}' no es válido`)
      .bail()
      .isMongoId().withMessage(`El filtro '${n}' no es un identificador válido`)
  ),
  manejarErroresValidacion
];

// Filtros de texto de query: solo strings simples (bloquea ?estado[$ne]=x)
const validarQueryTextos = (...nombres) => [
  ...nombres.map((n) =>
    query(n).optional().isString().withMessage(`El filtro '${n}' no es válido`)
  ),
  manejarErroresValidacion
];

module.exports = { validarId, validarQueryIds, validarQueryTextos, manejarErroresValidacion };
