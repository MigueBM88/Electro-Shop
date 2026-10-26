const { body } = require('express-validator');

const validarCategoria = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres'),

  body('descripcion')
    .optional().trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),

  body('icono').optional().trim().isLength({ max: 20 }).withMessage('El icono no puede exceder 20 caracteres'),

  body('padre')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      // Acepta solo ObjectId válido
      return /^[0-9a-fA-F]{24}$/.test(value);
    }).withMessage('La categoría padre indicada no es válida'),

  body('activa').optional().isBoolean().withMessage('El campo activa debe ser verdadero o falso')
];

// Edición: todos opcionales
const validarEdicionCategoria = [
  body('nombre').optional().trim().isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres'),
  body('descripcion').optional().trim().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres'),
  body('icono').optional().trim().isLength({ max: 20 }).withMessage('El icono no puede exceder 20 caracteres'),
  body('padre').optional({ nullable: true }).custom((value) => {
    if (value === null || value === '') return true;
    return /^[0-9a-fA-F]{24}$/.test(value);
  }).withMessage('La categoría padre indicada no es válida'),
  body('activa').optional().isBoolean().withMessage('El campo activa debe ser verdadero o falso')
];

module.exports = { validarCategoria, validarEdicionCategoria };
