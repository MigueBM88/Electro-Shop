const mongoose = require('mongoose');

// Registro de cada cambio de stock para trazabilidad del inventario
const movimientoSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
      index: true
    },
    tipo: {
      type: String,
      enum: ['entrada', 'salida', 'ajuste', 'venta', 'cancelacion'],
      required: true
    },
    cantidad: { type: Number, required: true }, // positivo o negativo según el movimiento
    stockAnterior: { type: Number, required: true },
    stockNuevo: { type: Number, required: true },
    motivo: { type: String, default: '' },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // quién lo hizo (admin)
  },
  { timestamps: true }
);

module.exports = mongoose.model('MovimientoInventario', movimientoSchema);
