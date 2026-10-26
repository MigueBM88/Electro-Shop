const { validationResult } = require('express-validator');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

// Helper: formatear errores de validación
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

// ============================================
// PÚBLICO
// ============================================

// GET /api/categorias  -> categorías principales (padre = null)
const listarPrincipales = async (req, res) => {
  try {
    const categorias = await Categoria.find({ padre: null, activa: true }).sort({ nombre: 1 });
    res.status(200).json({ exito: true, datos: { categorias } });
  } catch (error) {
    console.error('Error al listar categorías:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las categorías' });
  }
};

// GET /api/categorias/:id/subcategorias
const listarSubcategorias = async (req, res) => {
  try {
    const subcategorias = await Categoria.find({ padre: req.params.id, activa: true }).sort({ nombre: 1 });
    res.status(200).json({ exito: true, datos: { subcategorias } });
  } catch (error) {
    console.error('Error al listar subcategorías:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las subcategorías' });
  }
};

// GET /api/categorias/arbol?activas=true  -> árbol completo (principales con subcategorias)
const arbolCategorias = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.activas === 'true') filtro.activa = true;

    const todas = await Categoria.find(filtro).sort({ nombre: 1 }).lean();

    const principales = todas.filter((c) => !c.padre);
    const arbol = principales.map((p) => ({
      ...p,
      subcategorias: todas.filter((c) => c.padre && c.padre.toString() === p._id.toString())
    }));

    res.status(200).json({ exito: true, datos: { arbol } });
  } catch (error) {
    console.error('Error al obtener árbol de categorías:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener el árbol de categorías' });
  }
};

// ============================================
// ADMIN
// ============================================

// POST /api/categorias
const crearCategoria = async (req, res) => {
  try {
    if (erroresValidacion(req, res)) return;

    const { nombre, descripcion, icono, padre, activa } = req.body;

    // Si se indica padre, verificar que exista
    if (padre) {
      const padreExiste = await Categoria.findById(padre);
      if (!padreExiste) {
        return res.status(400).json({ exito: false, mensaje: 'La categoría padre indicada no existe' });
      }
    }

    const categoria = await Categoria.create({
      nombre,
      descripcion: descripcion || '',
      icono: icono || '',
      padre: padre || null,
      activa: activa !== undefined ? activa : true
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Categoría creada exitosamente',
      datos: { categoria }
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al crear la categoría' });
  }
};

// PUT /api/categorias/:id
const editarCategoria = async (req, res) => {
  try {
    if (erroresValidacion(req, res)) return;

    const { id } = req.params;
    const { padre } = req.body;

    // No permitir que una categoría sea su propio padre
    if (padre && padre === id) {
      return res.status(400).json({ exito: false, mensaje: 'Una categoría no puede ser su propia categoría padre' });
    }

    const camposPermitidos = ['nombre', 'descripcion', 'icono', 'padre', 'activa'];
    const datos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) datos[campo] = req.body[campo];
    });

    const categoria = await Categoria.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
    if (!categoria) {
      return res.status(404).json({ exito: false, mensaje: 'Categoría no encontrada' });
    }

    res.status(200).json({
      exito: true,
      mensaje: 'Categoría actualizada exitosamente',
      datos: { categoria }
    });
  } catch (error) {
    console.error('Error al editar categoría:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar la categoría' });
  }
};

// DELETE /api/categorias/:id
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar si tiene subcategorías
    const subcats = await Categoria.countDocuments({ padre: id });
    if (subcats > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se puede eliminar: la categoría tiene subcategorías asociadas'
      });
    }

    // No permitir eliminar si tiene productos asociados
    const productos = await Producto.countDocuments({ categoria: id });
    if (productos > 0) {
      return res.status(400).json({
        exito: false,
        mensaje: `No se puede eliminar: hay ${productos} producto(s) asociado(s) a esta categoría`
      });
    }

    const categoria = await Categoria.findByIdAndDelete(id);
    if (!categoria) {
      return res.status(404).json({ exito: false, mensaje: 'Categoría no encontrada' });
    }

    res.status(200).json({ exito: true, mensaje: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar la categoría' });
  }
};

module.exports = {
  listarPrincipales,
  listarSubcategorias,
  arbolCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria
};
