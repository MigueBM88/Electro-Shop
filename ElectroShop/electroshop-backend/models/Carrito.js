const mongoose = require('mongoose');

const itemCarritoSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: [1, 'La cantidad mínima es 1'],
      default: 1
    },
    // Precio al momento de agregar (se recalcula al leer para reflejar cambios)
    precioUnitario: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const carritoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // un carrito activo por usuario
    },
    items: {
      type: [itemCarritoSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('Carrito', carritoSchema);
