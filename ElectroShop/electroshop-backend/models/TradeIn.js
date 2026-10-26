const mongoose = require('mongoose');

// Solicitud de Trade-In: el cliente ofrece un equipo usado para reacondicionamiento/crédito
const tradeInSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    nombreEquipo: {
      type: String,
      required: [true, 'El nombre del equipo es obligatorio'],
      trim: true,
      maxlength: 150
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción del estado es obligatoria'],
      trim: true,
      maxlength: 2000
    },
    condicionDeclarada: {
      type: String,
      enum: ['excelente', 'bueno', 'regular', 'para_repuestos'],
      default: 'bueno'
    },
    imagenesUrls: { type: [String], default: [] },
    precioEstimadoCliente: { type: Number, min: 0, default: null }, // lo que el cliente espera recibir

    // Evaluación del admin
    estado: {
      type: String,
      enum: ['solicitado', 'en_revision', 'aprobado', 'rechazado', 'contraoferta'],
      default: 'solicitado',
      index: true
    },
    ofertaAdmin: { type: Number, min: 0, default: null }, // crédito ofrecido
    notaAdmin: { type: String, default: '' },

    historial: [
      {
        estado: String,
        fecha: { type: Date, default: Date.now },
        nota: { type: String, default: '' }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('TradeIn', tradeInSchema);
