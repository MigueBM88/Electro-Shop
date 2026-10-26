const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [80, 'El nombre no puede exceder 80 caracteres']
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
      default: ''
    },
    icono: {
      type: String,
      trim: true,
      default: ''
    },
    // Si tiene padre => es subcategoría. Si es null => categoría principal.
    padre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      default: null
    },
    activa: {
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

categoriaSchema.index({ padre: 1 });
categoriaSchema.index({ activa: 1 });

module.exports = mongoose.model('Categoria', categoriaSchema);
