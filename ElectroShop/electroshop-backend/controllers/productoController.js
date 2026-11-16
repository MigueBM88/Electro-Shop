const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Resena = require('../models/Resena');

const erroresValidacion = (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    res.status(400).json({
      exito: false,
      mensaje: errores.array()[0].msg || 'Error de validación',
      errores: errores.array().map((err) => ({ campo: err.path, mensaje: err.msg }))
    });
    return true;
  }
  return false;
};

// Campos que el admin puede asignar al crear/editar un producto (el resto se ignora)
const CAMPOS_PRODUCTO_ADMIN = [
  'nombre', 'descripcion', 'sku', 'marca', 'categoria', 'precio', 'precioOriginal',
  'stock', 'condicion', 'especificaciones', 'imagenes', 'datasheetUrl', 'activo', 'vendedor'
];

const tomarCamposPermitidos = (body) => {
  const datos = {};
  CAMPOS_PRODUCTO_ADMIN.forEach((campo) => {
    if (body && body[campo] !== undefined) datos[campo] = body[campo];
  });
  return datos;
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

    // Incluye los productos de las subcategorías (si es una categoría principal)
    const subs = await Categoria.find({ padre: req.params.catId }).select('_id');
    const filtro = { categoria: { $in: [req.params.catId, ...subs.map((s) => s._id)] }, activo: true };

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

// GET /api/productos/buscar
// Query: q (o busqueda), categoria, marca, precioMin, precioMax,
//        disponibilidad (disponible|agotado), condicion, ordenar, pagina, limite
const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ORDEN_BUSQUEDA = {
  precio_asc: { precio: 1 },
  precio_desc: { precio: -1 },
  nombre_asc: { nombre: 1 },
  reciente: { createdAt: -1 }
};

// Ordena por el promedio de estrellas de las reseñas publicadas.
// Desempate: más reseñas primero, luego más reciente. Sin reseñas = al final.
// Nota: aggregate() no convierte strings a ObjectId como find(), por eso se castea el filtro.
const buscarOrdenadoPorCalificacion = async (filtro, salto, limite) => {
  const filtroAgg = { ...filtro };
  if (filtroAgg.categoria && filtroAgg.categoria.$in) {
    filtroAgg.categoria = { $in: filtroAgg.categoria.$in.map((id) => new mongoose.Types.ObjectId(String(id))) };
  }

  const [resultado] = await Producto.aggregate([
    { $match: filtroAgg },
    {
      $lookup: {
        from: Resena.collection.name,
        let: { pid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$producto', '$$pid'] }, estado: 'publicada' } },
          { $group: { _id: null, promedio: { $avg: '$calificacion' }, cantidad: { $sum: 1 } } }
        ],
        as: 'stats'
      }
    },
    {
      $addFields: {
        promedioCalificacion: { $ifNull: [{ $arrayElemAt: ['$stats.promedio', 0] }, 0] },
        cantidadResenas: { $ifNull: [{ $arrayElemAt: ['$stats.cantidad', 0] }, 0] }
      }
    },
    { $sort: { promedioCalificacion: -1, cantidadResenas: -1, createdAt: -1 } },
    {
      $facet: {
        pagina: [{ $skip: salto }, { $limit: limite }, { $project: { _id: 1, promedioCalificacion: 1, cantidadResenas: 1 } }],
        total: [{ $count: 'n' }]
      }
    }
  ]);

  const filas = resultado.pagina;
  const total = resultado.total.length ? resultado.total[0].n : 0;

  // Traer los documentos completos (con populate y toJSON del modelo) respetando el orden
  const docs = await Producto.find({ _id: { $in: filas.map((f) => f._id) } }).populate('categoria', 'nombre icono');
  const porId = new Map(docs.map((d) => [d._id.toString(), d]));
  const productos = filas
    .map((f) => {
      const d = porId.get(f._id.toString());
      if (!d) return null;
      const o = d.toJSON();
      o.promedioCalificacion = Math.round(f.promedioCalificacion * 10) / 10;
      o.cantidadResenas = f.cantidadResenas;
      return o;
    })
    .filter(Boolean);

  return { productos, total };
};

const buscarProductos = async (req, res) => {
  try {
    const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
    const limite = Math.min(Math.max(parseInt(req.query.limite) || 12, 1), 50);
    const salto = (pagina - 1) * limite;
    // El frontend envía 'q'; se acepta 'busqueda' por compatibilidad
    const termino = String(req.query.q || req.query.busqueda || '').trim();

    const filtro = { activo: true };

    if (termino) {
      const rx = { $regex: escaparRegex(termino), $options: 'i' };
      filtro.$or = [{ nombre: rx }, { marca: rx }, { sku: rx }, { descripcion: rx }];
    }

    // Categoría: si es principal, incluye también sus subcategorías
    if (req.query.categoria) {
      const subs = await Categoria.find({ padre: req.query.categoria }).select('_id');
      filtro.categoria = { $in: [req.query.categoria, ...subs.map((c) => c._id)] };
    }

    if (req.query.marca) filtro.marca = req.query.marca;
    if (req.query.condicion) filtro.condicion = req.query.condicion;

    const min = parseFloat(req.query.precioMin);
    const max = parseFloat(req.query.precioMax);
    if (!isNaN(min) || !isNaN(max)) {
      filtro.precio = {};
      if (!isNaN(min)) filtro.precio.$gte = min;
      if (!isNaN(max)) filtro.precio.$lte = max;
    }

    if (req.query.disponibilidad === 'disponible') filtro.stock = { $gt: 0 };
    else if (req.query.disponibilidad === 'agotado') filtro.stock = { $lte: 0 };

    // 'calificacion' se resuelve aparte con buscarOrdenadoPorCalificacion
    const orden = ORDEN_BUSQUEDA[req.query.ordenar] || { createdAt: -1 };

    let productos;
    let total;
    if (req.query.ordenar === 'calificacion') {
      ({ productos, total } = await buscarOrdenadoPorCalificacion(filtro, salto, limite));
    } else {
      [productos, total] = await Promise.all([
        Producto.find(filtro).populate('categoria', 'nombre icono').sort(orden).skip(salto).limit(limite),
        Producto.countDocuments(filtro)
      ]);
    }

    // Sugerencias si no hay resultados (productos completos, el frontend los muestra como tarjetas)
    let sugerencias = [];
    if (productos.length === 0) {
      sugerencias = await Producto.find({ activo: true, stock: { $gt: 0 } })
        .populate('categoria', 'nombre icono')
        .sort({ createdAt: -1 })
        .limit(4);
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

    const producto = await Producto.create(tomarCamposPermitidos(req.body));
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
        mensaje: Object.values(error.errors)[0]?.message || 'Error de validación',
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

    const producto = await Producto.findByIdAndUpdate(req.params.id, tomarCamposPermitidos(req.body), {
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
        mensaje: Object.values(error.errors)[0]?.message || 'Error de validación',
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
