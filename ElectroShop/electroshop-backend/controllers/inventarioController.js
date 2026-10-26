const Producto = require('../models/Producto');
const MovimientoInventario = require('../models/MovimientoInventario');

const UMBRAL_BAJO_STOCK = 10; // productos con stock <= este valor se consideran "bajo stock"

// GET /api/inventario/resumen  (admin) -> KPIs del inventario
const resumenInventario = async (req, res) => {
  try {
    const [total, activos, agotados, bajoStock, valorAgg] = await Promise.all([
      Producto.countDocuments({}),
      Producto.countDocuments({ activo: true }),
      Producto.countDocuments({ stock: 0 }),
      Producto.countDocuments({ stock: { $gt: 0, $lte: UMBRAL_BAJO_STOCK } }),
      Producto.aggregate([{ $group: { _id: null, valor: { $sum: { $multiply: ['$precio', '$stock'] } }, unidades: { $sum: '$stock' } } }])
    ]);

    const valorInventario = valorAgg.length ? Math.round(valorAgg[0].valor) : 0;
    const unidadesTotales = valorAgg.length ? valorAgg[0].unidades : 0;

    res.status(200).json({
      exito: true,
      datos: {
        resumen: { totalProductos: total, activos, agotados, bajoStock, valorInventario, unidadesTotales, umbralBajoStock: UMBRAL_BAJO_STOCK }
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de inventario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener el resumen de inventario' });
  }
};

// GET /api/inventario/alertas  (admin) -> productos con bajo stock o agotados
const alertasStock = async (req, res) => {
  try {
    const productos = await Producto.find({ stock: { $lte: UMBRAL_BAJO_STOCK } })
      .populate('categoria', 'nombre')
      .select('nombre sku stock precio categoria activo')
      .sort({ stock: 1 });

    res.status(200).json({ exito: true, datos: { productos, umbral: UMBRAL_BAJO_STOCK } });
  } catch (error) {
    console.error('Error al obtener alertas de stock:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las alertas de stock' });
  }
};

// POST /api/inventario/ajuste  (admin)  body: { productoId, tipo, cantidad, motivo }
// tipo: 'entrada' (sumar), 'salida' (restar), 'ajuste' (fijar stock al valor dado)
const ajustarStock = async (req, res) => {
  try {
    const { productoId, tipo, cantidad, motivo } = req.body;
    const cant = parseInt(cantidad);

    if (!productoId || !['entrada', 'salida', 'ajuste'].includes(tipo)) {
      return res.status(400).json({ exito: false, mensaje: 'Datos de ajuste inválidos' });
    }
    if (isNaN(cant) || cant < 0) {
      return res.status(400).json({ exito: false, mensaje: 'La cantidad debe ser un número válido (>= 0)' });
    }

    const producto = await Producto.findById(productoId);
    if (!producto) return res.status(404).json({ exito: false, mensaje: 'Producto no encontrado' });

    const stockAnterior = producto.stock;
    let stockNuevo;
    if (tipo === 'entrada') stockNuevo = stockAnterior + cant;
    else if (tipo === 'salida') stockNuevo = Math.max(0, stockAnterior - cant);
    else stockNuevo = cant; // ajuste: fijar

    producto.stock = stockNuevo;
    await producto.save();

    await MovimientoInventario.create({
      producto: productoId,
      tipo,
      cantidad: stockNuevo - stockAnterior,
      stockAnterior,
      stockNuevo,
      motivo: motivo || '',
      usuario: req.usuario._id
    });

    res.status(200).json({
      exito: true,
      mensaje: 'Stock actualizado correctamente',
      datos: { producto: { id: producto._id, nombre: producto.nombre, stock: stockNuevo } }
    });
  } catch (error) {
    console.error('Error al ajustar stock:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al ajustar el stock' });
  }
};

// GET /api/inventario/movimientos  (admin) -> historial (opcional ?productoId=)
const historialMovimientos = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const salto = (pagina - 1) * limite;

    const filtro = {};
    if (req.query.productoId) filtro.producto = req.query.productoId;

    const [movimientos, total] = await Promise.all([
      MovimientoInventario.find(filtro)
        .populate('producto', 'nombre sku')
        .populate('usuario', 'nombre')
        .sort({ createdAt: -1 })
        .skip(salto)
        .limit(limite),
      MovimientoInventario.countDocuments(filtro)
    ]);

    res.status(200).json({
      exito: true,
      datos: { movimientos, paginacion: { total, pagina, limite, totalPaginas: Math.ceil(total / limite) || 1 } }
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener el historial de movimientos' });
  }
};

module.exports = {
  resumenInventario,
  alertasStock,
  ajustarStock,
  historialMovimientos
};
