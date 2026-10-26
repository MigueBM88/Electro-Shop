const crypto = require('crypto');
const Pedido = require('../models/Pedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');

const TASA_IMPUESTO = 0.13;
const COSTO_ENVIO = 2500;
const ENVIO_GRATIS_DESDE = 50000;

// Simula el procesamiento de pago. Aprueba salvo que se fuerce rechazo
// (metodoPago 'tarjeta' con número terminado en 0000 => rechazado, para pruebas).
function procesarPagoSimulado(metodoPago, datosPago = {}) {
  const referencia = 'TXN-' + crypto.randomBytes(6).toString('hex').toUpperCase();

  // Regla de prueba: tarjeta terminada en 0000 => rechazo
  if (metodoPago === 'tarjeta' && datosPago.numeroTarjeta) {
    const limpio = String(datosPago.numeroTarjeta).replace(/\s/g, '');
    if (limpio.endsWith('0000')) {
      return { estado: 'rechazado', referencia, fecha: new Date() };
    }
  }
  // contra_entrega queda pendiente (se paga al recibir)
  if (metodoPago === 'contra_entrega') {
    return { estado: 'pendiente', referencia, fecha: null };
  }
  return { estado: 'aprobado', referencia, fecha: new Date() };
}

// POST /api/pedidos/checkout
// body: { metodoPago, datosPago?: { numeroTarjeta }, direccionEnvio? }
const checkout = async (req, res) => {
  try {
    const { metodoPago = 'tarjeta', datosPago = {}, direccionEnvio } = req.body;

    const carrito = await Carrito.findOne({ usuario: req.usuario._id }).populate(
      'items.producto',
      'nombre sku precio stock activo'
    );

    if (!carrito || carrito.items.length === 0) {
      return res.status(400).json({ exito: false, mensaje: 'El carrito está vacío' });
    }

    // 1) Validar stock y construir líneas congeladas
    const lineas = [];
    let subtotal = 0;
    for (const item of carrito.items) {
      const p = item.producto;
      if (!p || !p.activo) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Uno de los productos del carrito ya no está disponible. Revisa tu carrito.'
        });
      }
      if (item.cantidad > p.stock) {
        return res.status(400).json({
          exito: false,
          mensaje: `Stock insuficiente para "${p.nombre}". Disponible: ${p.stock}`
        });
      }
      const sub = p.precio * item.cantidad;
      subtotal += sub;
      lineas.push({
        producto: p._id,
        nombre: p.nombre,
        sku: p.sku || '',
        precioUnitario: p.precio,
        cantidad: item.cantidad,
        subtotal: sub
      });
    }

    // 2) Totales
    const impuesto = Math.round(subtotal * TASA_IMPUESTO);
    const envio = subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO;
    const total = subtotal + impuesto + envio;

    // 3) Pago simulado
    const pago = procesarPagoSimulado(metodoPago, datosPago);
    if (pago.estado === 'rechazado') {
      return res.status(402).json({
        exito: false,
        mensaje: 'El pago fue rechazado. Verifica los datos de tu tarjeta e intenta nuevamente.',
        datos: { referencia: pago.referencia }
      });
    }

    // 4) Dirección de envío (usa la enviada o la del perfil)
    const dir = direccionEnvio || req.usuario.direccion || {};

    // 5) Estado inicial según pago
    const estadoInicial = pago.estado === 'aprobado' ? 'pagado' : 'pendiente';

    // 6) Crear el pedido
    const pedido = await Pedido.create({
      usuario: req.usuario._id,
      items: lineas,
      subtotal,
      impuesto,
      envio,
      total,
      direccionEnvio: {
        provincia: dir.provincia || '',
        canton: dir.canton || '',
        distrito: dir.distrito || '',
        detalle: dir.detalle || ''
      },
      metodoPago,
      pago,
      estado: estadoInicial,
      historialEstados: [{ estado: estadoInicial, nota: 'Pedido creado' }]
    });

    // 7) Descontar stock (solo si el pago no fue rechazado)
    for (const linea of lineas) {
      await Producto.findByIdAndUpdate(linea.producto, { $inc: { stock: -linea.cantidad } });
    }

    // 8) Vaciar el carrito
    carrito.items = [];
    await carrito.save();

    res.status(201).json({
      exito: true,
      mensaje: '¡Pedido realizado con éxito!',
      datos: { pedido }
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al procesar el pedido' });
  }
};

// GET /api/pedidos  -> historial del usuario autenticado
const misPedidos = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const salto = (pagina - 1) * limite;

    const filtro = { usuario: req.usuario._id };
    if (req.query.estado) filtro.estado = req.query.estado;

    const [pedidos, total] = await Promise.all([
      Pedido.find(filtro).sort({ createdAt: -1 }).skip(salto).limit(limite),
      Pedido.countDocuments(filtro)
    ]);

    res.status(200).json({
      exito: true,
      datos: {
        pedidos,
        paginacion: { total, pagina, limite, totalPaginas: Math.ceil(total / limite) || 1 }
      }
    });
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener el historial de pedidos' });
  }
};

// GET /api/pedidos/:id  -> detalle (dueño o admin)
const detallePedido = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).populate('usuario', 'nombre correo');
    if (!pedido) {
      return res.status(404).json({ exito: false, mensaje: 'Pedido no encontrado' });
    }
    // Solo el dueño o un admin pueden ver el pedido
    const esDueno = pedido.usuario._id.toString() === req.usuario._id.toString();
    if (!esDueno && req.usuario.rol !== 'admin') {
      return res.status(403).json({ exito: false, mensaje: 'No tiene permiso para ver este pedido' });
    }
    res.status(200).json({ exito: true, datos: { pedido } });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener el pedido' });
  }
};

// PUT /api/pedidos/:id/cancelar  -> el dueño cancela (solo si aún no fue enviado)
const cancelarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ exito: false, mensaje: 'Pedido no encontrado' });

    if (pedido.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ exito: false, mensaje: 'No tiene permiso para cancelar este pedido' });
    }
    if (['enviado', 'entregado', 'cancelado'].includes(pedido.estado)) {
      return res.status(400).json({ exito: false, mensaje: `No se puede cancelar un pedido en estado "${pedido.estado}"` });
    }

    // Reponer stock
    for (const linea of pedido.items) {
      if (linea.producto) {
        await Producto.findByIdAndUpdate(linea.producto, { $inc: { stock: linea.cantidad } });
      }
    }

    pedido.estado = 'cancelado';
    pedido.historialEstados.push({ estado: 'cancelado', nota: 'Cancelado por el cliente' });
    await pedido.save();

    res.status(200).json({ exito: true, mensaje: 'Pedido cancelado y stock repuesto', datos: { pedido } });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al cancelar el pedido' });
  }
};

// ============================================
// ADMIN
// ============================================

// GET /api/pedidos/admin/lista
const listarPedidosAdmin = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 15;
    const salto = (pagina - 1) * limite;

    const filtro = {};
    if (req.query.estado) filtro.estado = req.query.estado;

    const [pedidos, total] = await Promise.all([
      Pedido.find(filtro).populate('usuario', 'nombre correo').sort({ createdAt: -1 }).skip(salto).limit(limite),
      Pedido.countDocuments(filtro)
    ]);

    res.status(200).json({
      exito: true,
      datos: {
        pedidos,
        paginacion: { total, pagina, limite, totalPaginas: Math.ceil(total / limite) || 1 }
      }
    });
  } catch (error) {
    console.error('Error al listar pedidos (admin):', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener los pedidos' });
  }
};

// PUT /api/pedidos/:id/estado  (admin) body: { estado, nota? }
const actualizarEstadoPedido = async (req, res) => {
  try {
    const { estado, nota } = req.body;
    const estadosValidos = ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado de pedido inválido' });
    }

    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ exito: false, mensaje: 'Pedido no encontrado' });

    // Si se cancela desde admin y no estaba cancelado, reponer stock
    if (estado === 'cancelado' && pedido.estado !== 'cancelado') {
      for (const linea of pedido.items) {
        if (linea.producto) {
          await Producto.findByIdAndUpdate(linea.producto, { $inc: { stock: linea.cantidad } });
        }
      }
    }

    pedido.estado = estado;
    pedido.historialEstados.push({ estado, nota: nota || `Estado actualizado a ${estado}` });
    await pedido.save();

    res.status(200).json({ exito: true, mensaje: 'Estado del pedido actualizado', datos: { pedido } });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar el estado del pedido' });
  }
};

module.exports = {
  checkout,
  misPedidos,
  detallePedido,
  cancelarPedido,
  listarPedidosAdmin,
  actualizarEstadoPedido
};
