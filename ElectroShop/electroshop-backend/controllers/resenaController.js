const Resena = require('../models/Resena');
const Pedido = require('../models/Pedido');
const mongoose = require('mongoose');

// Calcula y devuelve el promedio + conteo de un producto (solo publicadas)
async function resumenCalificacion(productoId) {
  const agg = await Resena.aggregate([
    { $match: { producto: new mongoose.Types.ObjectId(String(productoId)), estado: 'publicada' } },
    { $group: { _id: '$producto', promedio: { $avg: '$calificacion' }, total: { $sum: 1 } } }
  ]);
  if (agg.length === 0) return { promedio: 0, total: 0 };
  return { promedio: Math.round(agg[0].promedio * 10) / 10, total: agg[0].total };
}

// GET /api/resenas/producto/:productoId  (público)
const listarPorProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    const resenas = await Resena.find({ producto: productoId, estado: 'publicada' }).sort({ createdAt: -1 });
    const resumen = await resumenCalificacion(productoId);
    res.status(200).json({ exito: true, datos: { resenas, resumen } });
  } catch (error) {
    console.error('Error al listar reseñas:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las reseñas' });
  }
};

// POST /api/resenas  (cliente)  body: { productoId, calificacion, comentario }
const crearResena = async (req, res) => {
  try {
    const { productoId, calificacion, comentario } = req.body;
    const cal = parseInt(calificacion);

    if (!productoId) return res.status(400).json({ exito: false, mensaje: 'Debe indicar el producto' });
    if (!cal || cal < 1 || cal > 5) {
      return res.status(400).json({ exito: false, mensaje: 'La calificación debe ser entre 1 y 5' });
    }

    // ¿Ya reseñó este producto?
    const existente = await Resena.findOne({ producto: productoId, usuario: req.usuario._id });
    if (existente) {
      return res.status(400).json({ exito: false, mensaje: 'Ya has reseñado este producto' });
    }

    // Compra verificada: ¿tiene un pedido entregado/pagado con este producto?
    const tienePedido = await Pedido.findOne({
      usuario: req.usuario._id,
      'items.producto': productoId,
      estado: { $in: ['pagado', 'preparando', 'enviado', 'entregado'] }
    });

    const resena = await Resena.create({
      producto: productoId,
      usuario: req.usuario._id,
      nombreUsuario: req.usuario.nombre,
      calificacion: cal,
      comentario: comentario || '',
      compraVerificada: !!tienePedido
    });

    const resumen = await resumenCalificacion(productoId);
    res.status(201).json({ exito: true, mensaje: 'Reseña publicada', datos: { resena, resumen } });
  } catch (error) {
    console.error('Error al crear reseña:', error);
    if (error.code === 11000) {
      return res.status(400).json({ exito: false, mensaje: 'Ya has reseñado este producto' });
    }
    res.status(500).json({ exito: false, mensaje: 'Error al publicar la reseña' });
  }
};

// DELETE /api/resenas/:id  (dueño o admin)
const eliminarResena = async (req, res) => {
  try {
    const resena = await Resena.findById(req.params.id);
    if (!resena) return res.status(404).json({ exito: false, mensaje: 'Reseña no encontrada' });

    const esDueno = resena.usuario.toString() === req.usuario._id.toString();
    if (!esDueno && req.usuario.rol !== 'admin') {
      return res.status(403).json({ exito: false, mensaje: 'No tiene permiso para eliminar esta reseña' });
    }
    await resena.deleteOne();
    res.status(200).json({ exito: true, mensaje: 'Reseña eliminada' });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar la reseña' });
  }
};

// ============================================
// ADMIN - moderación
// ============================================

// GET /api/resenas/admin/lista
const listarAdmin = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const salto = (pagina - 1) * limite;

    const filtro = {};
    if (req.query.estado) filtro.estado = req.query.estado;

    const [resenas, total] = await Promise.all([
      Resena.find(filtro).populate('producto', 'nombre').sort({ createdAt: -1 }).skip(salto).limit(limite),
      Resena.countDocuments(filtro)
    ]);

    res.status(200).json({
      exito: true,
      datos: { resenas, paginacion: { total, pagina, limite, totalPaginas: Math.ceil(total / limite) || 1 } }
    });
  } catch (error) {
    console.error('Error al listar reseñas (admin):', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las reseñas' });
  }
};

// PUT /api/resenas/:id/moderar  (admin) body: { estado: 'publicada'|'oculta' }
const moderarResena = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['publicada', 'oculta'].includes(estado)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado inválido' });
    }
    const resena = await Resena.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    if (!resena) return res.status(404).json({ exito: false, mensaje: 'Reseña no encontrada' });
    res.status(200).json({ exito: true, mensaje: `Reseña ${estado === 'oculta' ? 'ocultada' : 'publicada'}`, datos: { resena } });
  } catch (error) {
    console.error('Error al moderar reseña:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al moderar la reseña' });
  }
};

module.exports = {
  listarPorProducto,
  crearResena,
  eliminarResena,
  listarAdmin,
  moderarResena
};
