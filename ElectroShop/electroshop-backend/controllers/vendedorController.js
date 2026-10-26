const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');

// GET /api/vendedor/productos  -> productos del vendedor autenticado
const misProductos = async (req, res) => {
  try {
    const productos = await Producto.find({ vendedor: req.usuario._id })
      .populate('categoria', 'nombre')
      .sort({ createdAt: -1 });
    res.status(200).json({ exito: true, datos: { productos } });
  } catch (error) {
    console.error('Error al listar productos del vendedor:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener tus productos' });
  }
};

// POST /api/vendedor/productos  -> crear producto propio
const crearProducto = async (req, res) => {
  try {
    const datos = { ...req.body, vendedor: req.usuario._id };
    const producto = await Producto.create(datos);
    await producto.populate('categoria', 'nombre');
    res.status(201).json({ exito: true, mensaje: 'Producto creado', datos: { producto } });
  } catch (error) {
    console.error('Error al crear producto (vendedor):', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        exito: false, mensaje: 'Error de validación',
        errores: Object.values(error.errors).map((e) => ({ campo: e.path, mensaje: e.message }))
      });
    }
    res.status(500).json({ exito: false, mensaje: 'Error al crear el producto' });
  }
};

// PUT /api/vendedor/productos/:id  -> editar SOLO si es dueño
const editarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ exito: false, mensaje: 'Producto no encontrado' });
    if (!producto.vendedor || producto.vendedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ exito: false, mensaje: 'Solo puedes editar tus propios productos' });
    }

    // No permitir cambiar el dueño
    const datos = { ...req.body };
    delete datos.vendedor;

    Object.assign(producto, datos);
    await producto.save();
    await producto.populate('categoria', 'nombre');
    res.status(200).json({ exito: true, mensaje: 'Producto actualizado', datos: { producto } });
  } catch (error) {
    console.error('Error al editar producto (vendedor):', error);
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar el producto' });
  }
};

// DELETE /api/vendedor/productos/:id  -> eliminar SOLO si es dueño
const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ exito: false, mensaje: 'Producto no encontrado' });
    if (!producto.vendedor || producto.vendedor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ exito: false, mensaje: 'Solo puedes eliminar tus propios productos' });
    }
    await producto.deleteOne();
    res.status(200).json({ exito: true, mensaje: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto (vendedor):', error);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar el producto' });
  }
};

// GET /api/vendedor/ventas  -> pedidos que incluyen productos del vendedor
const misVentas = async (req, res) => {
  try {
    // IDs de los productos del vendedor
    const productos = await Producto.find({ vendedor: req.usuario._id }).select('_id');
    const ids = productos.map((p) => p._id);

    const pedidos = await Pedido.find({ 'items.producto': { $in: ids } })
      .populate('usuario', 'nombre correo')
      .sort({ createdAt: -1 });

    // Filtrar cada pedido para mostrar solo las líneas del vendedor + su subtotal
    const idsStr = ids.map((i) => i.toString());
    const ventas = pedidos.map((p) => {
      const lineas = p.items.filter((i) => i.producto && idsStr.includes(i.producto.toString()));
      const subtotalVendedor = lineas.reduce((s, l) => s + l.subtotal, 0);
      return {
        numero: p.numero,
        fecha: p.createdAt,
        estado: p.estado,
        cliente: p.usuario ? p.usuario.nombre : '—',
        lineas,
        subtotalVendedor
      };
    });

    const totalVendido = ventas
      .filter((v) => ['pagado', 'preparando', 'enviado', 'entregado'].includes(v.estado))
      .reduce((s, v) => s + v.subtotalVendedor, 0);

    res.status(200).json({ exito: true, datos: { ventas, totalVendido } });
  } catch (error) {
    console.error('Error al obtener ventas del vendedor:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener tus ventas' });
  }
};

module.exports = {
  misProductos,
  crearProducto,
  editarProducto,
  eliminarProducto,
  misVentas
};
