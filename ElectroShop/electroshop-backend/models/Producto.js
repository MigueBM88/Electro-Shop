const mongoose = require('mongoose');

const especificacionSchema = new mongoose.Schema(
  {
    nombre: { type: String, trim: true },
    valor: { type: String, trim: true }
  },
  { _id: false }
);

const imagenSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
    alt: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [150, 'El nombre no puede exceder 150 caracteres']
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    marca: {
      type: String,
      trim: true,
      default: 'Genérico'
    },
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'La categoría es obligatoria']
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo']
    },
    precioOriginal: {
      type: Number,
      min: [0, 'El precio original no puede ser negativo'],
      default: null
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0
    },
    condicion: {
      type: String,
      enum: {
        values: ['nuevo', 'reacondicionado', 'poco_uso'],
        message: 'La condición {VALUE} no es válida'
      },
      default: 'nuevo'
    },
    especificaciones: {
      type: [especificacionSchema],
      default: []
    },
    imagenes: {
      type: [imagenSchema],
      default: []
    },
    datasheetUrl: {
      type: String,
      trim: true,
      default: ''
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índice de texto para búsqueda por nombre, marca y SKU
productoSchema.index({ nombre: 'text', marca: 'text', sku: 'text' });
productoSchema.index({ categoria: 1 });
productoSchema.index({ activo: 1 });
productoSchema.index({ condicion: 1 });

module.exports = mongoose.model('Producto', productoSchema);
