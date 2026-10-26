const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');
const User = require('../models/User');

// Estados que cuentan como venta efectiva (excluye cancelados y pendientes de pago)
const ESTADOS_VENTA = ['pagado', 'preparando', 'enviado', 'entregado'];

// GET /api/reportes/resumen  (admin) -> KPIs generales
const resumenGeneral = async (req, res) => {
  try {
    const [ventasAgg, totalPedidos, totalClientes, totalProductos] = await Promise.all([
      Pedido.aggregate([
        { $match: { estado: { $in: ESTADOS_VENTA } } },
        { $group: { _id: null, ingresos: { $sum: '$total' }, pedidos: { $sum: 1 } } }
      ]),
      Pedido.countDocuments({}),
      User.countDocuments({ rol: 'cliente' }),
      Producto.countDocuments({ activo: true })
    ]);

    const ingresos = ventasAgg.length ? Math.round(ventasAgg[0].ingresos) : 0;
    const pedidosVenta = ventasAgg.length ? ventasAgg[0].pedidos : 0;
    const ticketPromedio = pedidosVenta ? Math.round(ingresos / pedidosVenta) : 0;

    res.status(200).json({
      exito: true,
      datos: { resumen: { ingresos, pedidosVenta, totalPedidos, totalClientes, totalProductos, ticketPromedio } }
    });
  } catch (error) {
    console.error('Error en resumen general:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar el resumen' });
  }
};

// GET /api/reportes/ventas-por-dia?dias=30  (admin) -> serie temporal de ingresos
const ventasPorDia = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    desde.setHours(0, 0, 0, 0);

    const datos = await Pedido.aggregate([
      { $match: { estado: { $in: ESTADOS_VENTA }, createdAt: { $gte: desde } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          ingresos: { $sum: '$total' },
          pedidos: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      exito: true,
      datos: {
        serie: datos.map((d) => ({ fecha: d._id, ingresos: Math.round(d.ingresos), pedidos: d.pedidos }))
      }
    });
  } catch (error) {
    console.error('Error en ventas por día:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar el reporte de ventas' });
  }
};

// GET /api/reportes/productos-top?limite=10  (admin) -> más vendidos (por unidades)
const productosTop = async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const datos = await Pedido.aggregate([
      { $match: { estado: { $in: ESTADOS_VENTA } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.producto',
          nombre: { $first: '$items.nombre' },
          unidades: { $sum: '$items.cantidad' },
          ingresos: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { unidades: -1 } },
      { $limit: limite }
    ]);

    res.status(200).json({
      exito: true,
      datos: { productos: datos.map((d) => ({ nombre: d.nombre || 'Producto eliminado', unidades: d.unidades, ingresos: Math.round(d.ingresos) })) }
    });
  } catch (error) {
    console.error('Error en productos top:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar el reporte de productos' });
  }
};

// GET /api/reportes/pedidos-por-estado  (admin) -> distribución por estado
const pedidosPorEstado = async (req, res) => {
  try {
    const datos = await Pedido.aggregate([
      { $group: { _id: '$estado', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    res.status(200).json({
      exito: true,
      datos: { distribucion: datos.map((d) => ({ estado: d._id, total: d.total })) }
    });
  } catch (error) {
    console.error('Error en pedidos por estado:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar la distribución de pedidos' });
  }
};

module.exports = {
  resumenGeneral,
  ventasPorDia,
  productosTop,
  pedidosPorEstado
};
