const { body } = require('express-validator');

const validarProducto = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),

  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),

  body('categoria')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isMongoId().withMessage('La categoría indicada no es válida'),

  body('precio')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),

  body('stock')
    .notEmpty().withMessage('El stock es obligatorio')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0'),

  body('condicion')
    .optional()
    .isIn(['nuevo', 'reacondicionado', 'poco_uso']).withMessage('La condición debe ser: nuevo, reacondicionado o poco_uso'),

  body('precioOriginal')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('El precio original debe ser un número mayor o igual a 0'),

  body('sku').optional().trim().isLength({ max: 50 }).withMessage('El SKU no puede exceder 50 caracteres'),
  body('marca').optional().trim().isLength({ max: 80 }).withMessage('La marca no puede exceder 80 caracteres')
];

// En edición, los campos son opcionales (solo valida los que vengan)
const validarEdicionProducto = [
  body('nombre').optional().trim().isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),
  body('descripcion').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('La descripción no puede exceder 2000 caracteres'),
  body('categoria').optional().isMongoId().withMessage('La categoría indicada no es válida'),
  body('precio').optional().isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser mayor o igual a 0'),
  body('condicion').optional().isIn(['nuevo', 'reacondicionado', 'poco_uso']).withMessage('Condición inválida'),
  body('precioOriginal').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El precio original debe ser mayor o igual a 0')
];

module.exports = { validarProducto, validarEdicionProducto };
