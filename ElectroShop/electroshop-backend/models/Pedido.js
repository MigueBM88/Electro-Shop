const mongoose = require('mongoose');

// Línea de pedido: "congela" los datos del producto al momento de la compra
const itemPedidoSchema = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    nombre: { type: String, required: true },
    sku: { type: String, default: '' },
    precioUnitario: { type: Number, required: true, min: 0 },
    cantidad: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const pedidoSchema = new mongoose.Schema(
  {
    // Número de pedido legible (ej. ES-20261026-0001)
    numero: { type: String, unique: true, index: true },

    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    items: {
      type: [itemPedidoSchema],
      required: true,
      validate: [(v) => v.length > 0, 'El pedido debe tener al menos un producto']
    },

    // Totales
    subtotal: { type: Number, required: true, min: 0 },
    impuesto: { type: Number, required: true, min: 0, default: 0 }, // IVA 13% CR
    envio: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    // Dirección de envío (copiada del perfil al momento de la compra)
    direccionEnvio: {
      provincia: { type: String, default: '' },
      canton: { type: String, default: '' },
      distrito: { type: String, default: '' },
      detalle: { type: String, default: '' }
    },

    // Pago simulado
    metodoPago: {
      type: String,
      enum: ['tarjeta', 'sinpe', 'contra_entrega'],
      default: 'tarjeta'
    },
    pago: {
      estado: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente'
      },
      referencia: { type: String, default: '' }, // id de transacción simulado
      fecha: { type: Date, default: null }
    },

    // Estado del pedido / seguimiento
    estado: {
      type: String,
      enum: ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'],
      default: 'pendiente',
      index: true
    },

    // Historial de cambios de estado (para el seguimiento)
    historialEstados: [
      {
        estado: { type: String },
        fecha: { type: Date, default: Date.now },
        nota: { type: String, default: '' }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Genera un número de pedido legible antes de guardar (solo en creación)
pedidoSchema.pre('validate', async function (next) {
  if (this.numero) return next();
  const fecha = new Date();
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  const prefijo = `ES-${y}${m}${d}`;

  // Contar pedidos del día para el consecutivo
  const inicioDia = new Date(y, fecha.getMonth(), fecha.getDate());
  const finDia = new Date(y, fecha.getMonth(), fecha.getDate() + 1);
  const Pedido = mongoose.model('Pedido');
  const countHoy = await Pedido.countDocuments({ createdAt: { $gte: inicioDia, $lt: finDia } });
  this.numero = `${prefijo}-${String(countHoy + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('Pedido', pedidoSchema);
