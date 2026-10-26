const { validationResult } = require('express-validator');
const Producto = require('../models/Producto');

const erroresValidacion = (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    res.status(400).json({
      exito: false,
      mensaje: 'Error de validación',
      errores: errores.array().map((err) => ({ campo: err.path, mensaje: err.msg }))
    });
    return true;
  }
  return false;
};

// Construye objeto de paginación estándar
const construirPaginacion = (total, pagina, limite) => ({
  total,
  pagina,
  limite,
  totalPaginas: Math.ceil(total / limite) || 1
});

// ============================================
// PÚBLICO
// ============================================

// GET /api/productos/categoria/:catId
const productosPorCategoria = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 12;
    const salto = (pagina - 1) * limite;

    const filtro = { categoria: req.params.catId, activo: true };

    const [productos, total] = await Promise.all([
      Producto.find(filtro).populate('categoria', 'nombre icono').sort({ createdAt: -1 }).skip(salto).limit(limite),
      Producto.countDocuments(filtro)
    ]);

    res.status(200).json({
      exito: true,
      datos: { productos, paginacion: construirPaginacion(total, pagina, limite) }
    });
  } catch (error) {
    console.error('Error al listar productos por categoría:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener los productos' });
  }
};

// GET /api/productos/buscar?busqueda=...&pagina=...
const buscarProductos = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 12;
    const salto = (pagina - 1) * limite;
    const termino = (req.query.busqueda || '').trim();

    const filtro = { activo: true };
    if (termino) {
      filtro.$or = [
        { nombre: { $regex: termino, $options: 'i' } },
        { marca: { $regex: termino, $options: 'i' } },
        { sku: { $regex: termino, $options: 'i' } }
      ];
    }
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.condicion) filtro.condicion = req.query.condicion;

    const [productos, total] = await Promise.all([
      Producto.find(filtro).populate('categoria', 'nombre icono').sort({ createdAt: -1 }).skip(salto).limit(limite),
      Producto.countDocuments(filtro)
    ]);

    // Sugerencias simples si no hay resultados
    let sugerencias = [];
    if (productos.length === 0 && termino) {
      sugerencias = await Producto.find({ activo: true })
        .select('nombre')
        .limit(5)
        .then((docs) => docs.map((d) => d.nombre));
    }

    res.status(200).json({
      exito: true,
      datos: { productos, sugerencias, paginacion: construirPaginacion(total, pagina, limite) }
    });
  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al buscar productos' });
  }
};

// GET /api/productos/marcas
const listarMarcas = async (req, res) => {
  try {
    const marcas = await Producto.distinct('marca', { activo: true });
    res.status(200).json({ exito: true, datos: { marcas: marcas.filter(Boolean).sort() } });
  } catch (error) {
    console.error('Error al listar marcas:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las marcas' });
  }
};

// GET /api/productos/:id  -> detalle + relacionados
const detalleProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate('categoria', 'nombre icono');
    if (!producto) {
      return res.status(404).json({ exito: false, mensaje: 'Producto no encontrado' });
    }

    // Productos relacionados: misma categoría, excluyendo el actual
    const relacionados = await Producto.find({
      categoria: producto.categoria ? producto.categoria._id : producto.categoria,
      _id: { $ne: producto._id },
      activo: true
    })
      .limit(4)
      .select('nombre precio precioOriginal imagenes marca condicion stock');

    res.status(200).json({ exito: true, datos: { producto, relacionados } });
  } catch (error) {
    console.error('Error al obtener detalle de producto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener el producto' });
  }
};

// ============================================
// ADMIN
// ============================================

// GET /api/productos/admin/lista
const listarProductosAdmin = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const salto = (pagina - 1) * limite;

    const filtro = {};
    if (req.query.busqueda) {
      const t = req.query.busqueda.trim();
      filtro.$or = [
        { nombre: { $regex: t, $options: 'i' } },
        { marca: { $regex: t, $options: 'i' } },
        { sku: { $regex: t, $options: 'i' } }
      ];
    }
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.condicion) filtro.condicion = req.query.condicion;
    if (req.query.activo !== undefined && req.query.activo !== '') {
      filtro.activo = req.query.activo === 'true';
    }

    const [productos, total] = await Promise.all([
      Producto.find(filtro).populate('categoria', 'nombre').sort({ createdAt: -1 }).skip(salto).limit(limite),
      Producto.countDocuments(filtro)
    ]);

    res.status(200).json({
      exito: true,
      datos: { productos, paginacion: construirPaginacion(total, pagina, limite) }
    });
  } catch (error) {
    console.error('Error al listar productos (admin):', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener los productos' });
  }
};

// POST /api/productos
const crearProducto = async (req, res) => {
  try {
    if (erroresValidacion(req, res)) return;

    const producto = await Producto.create(req.body);
    await producto.populate('categoria', 'nombre');

    res.status(201).json({
      exito: true,
      mensaje: 'Producto creado exitosamente',
      datos: { producto }
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: Object.values(error.errors).map((e) => ({ campo: e.path, mensaje: e.message }))
      });
    }
    res.status(500).json({ exito: false, mensaje: 'Error al crear el producto' });
  }
};

// PUT /api/productos/:id
const editarProducto = async (req, res) => {
  try {
    if (erroresValidacion(req, res)) return;

    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('categoria', 'nombre');

    if (!producto) {
      return res.status(404).json({ exito: false, mensaje: 'Producto no encontrado' });
    }

    res.status(200).json({
      exito: true,
      mensaje: 'Producto actualizado exitosamente',
      datos: { producto }
    });
  } catch (error) {
    console.error('Error al editar producto:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: Object.values(error.errors).map((e) => ({ campo: e.path, mensaje: e.message }))
      });
    }
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar el producto' });
  }
};

// DELETE /api/productos/:id
const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) {
      return res.status(404).json({ exito: false, mensaje: 'Producto no encontrado' });
    }
    res.status(200).json({ exito: true, mensaje: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar el producto' });
  }
};

module.exports = {
  productosPorCategoria,
  buscarProductos,
  listarMarcas,
  detalleProducto,
  listarProductosAdmin,
  crearProducto,
  editarProducto,
  eliminarProducto
};
