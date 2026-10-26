const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
      index: true
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    nombreUsuario: { type: String, default: '' }, // snapshot para mostrar
    calificacion: {
      type: Number,
      required: [true, 'La calificación es obligatoria'],
      min: [1, 'La calificación mínima es 1'],
      max: [5, 'La calificación máxima es 5']
    },
    comentario: {
      type: String,
      trim: true,
      maxlength: [1000, 'El comentario no puede exceder 1000 caracteres'],
      default: ''
    },
    compraVerificada: { type: Boolean, default: false },
    // Moderación admin
    estado: {
      type: String,
      enum: ['publicada', 'oculta'],
      default: 'publicada',
      index: true
    }
  },
  { timestamps: true }
);

// Un usuario solo puede reseñar un producto una vez
resenaSchema.index({ producto: 1, usuario: 1 }, { unique: true });

module.exports = mongoose.model('Resena', resenaSchema);
