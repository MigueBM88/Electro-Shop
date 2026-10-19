const { validationResult } = require('express-validator');
const User = require('../models/User');
const { enviarCorreoDesactivacion } = require('../utils/emailService');

// Escenario 1: Listar usuarios
const listarUsuarios = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const salto = (pagina - 1) * limite;

    const filtros = {};
    if (req.query.rol) filtros.rol = req.query.rol;
    if (req.query.activo !== undefined) filtros.activo = req.query.activo === 'true';
    if (req.query.busqueda) {
      filtros.$or = [
        { nombre: { $regex: req.query.busqueda, $options: 'i' } },
        { correo: { $regex: req.query.busqueda, $options: 'i' } }
      ];
    }

    const [usuarios, total] = await Promise.all([
      User.find(filtros)
        .select('nombre correo rol activo fechaRegistro ultimoAcceso')
        .sort({ fechaRegistro: -1 })
        .skip(salto)
        .limit(limite),
      User.countDocuments(filtros)
    ]);

    res.status(200).json({
      exito: true,
      datos: {
        usuarios,
        paginacion: {
          total,
          pagina,
          limite,
          totalPaginas: Math.ceil(total / limite)
        }
      }
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener la lista de usuarios' });
  }
};

// Obtener detalle de usuario
const obtenerUsuario = async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select(
      'nombre correo telefono direccion rol activo correoConfirmado fechaRegistro ultimoAcceso intentosFallidos bloqueadoHasta'
    );

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    res.status(200).json({ exito: true, datos: { usuario } });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener los datos del usuario' });
  }
};

// Escenario 2: Cambiar rol de usuario
const cambiarRolUsuario = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array().map((err) => ({ campo: err.path, mensaje: err.msg }))
      });
    }

    const { id } = req.params;
    const { rol } = req.body;

    if (id === req.usuario._id.toString()) {
      return res.status(400).json({ exito: false, mensaje: 'No puede cambiar su propio rol de administrador' });
    }

    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    const rolAnterior = usuario.rol;
    usuario.rol = rol;
    await usuario.save();

    res.status(200).json({
      exito: true,
      mensaje: `Rol del usuario actualizado exitosamente de '${rolAnterior}' a '${rol}'`,
      datos: {
        usuario: { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
      }
    });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al cambiar el rol del usuario' });
  }
};

// Escenario 3: Desactivar cuenta
const desactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.usuario._id.toString()) {
      return res.status(400).json({ exito: false, mensaje: 'No puede desactivar su propia cuenta de administrador' });
    }

    const usuario = await User.findById(id);
    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    if (!usuario.activo) {
      return res.status(400).json({ exito: false, mensaje: 'La cuenta del usuario ya se encuentra desactivada' });
    }

    usuario.activo = false;
    await usuario.save();

    try {
      await enviarCorreoDesactivacion(usuario);
    } catch (emailError) {
      console.error('Error al enviar correo de desactivación:', emailError);
    }

    res.status(200).json({
      exito: true,
      mensaje: `Cuenta del usuario ${usuario.nombre} desactivada exitosamente. Se ha enviado una notificación por correo`,
      datos: {
        usuario: { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo, activo: usuario.activo }
      }
    });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al desactivar la cuenta del usuario' });
  }
};

// Reactivar cuenta
const reactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findById(id);

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    if (usuario.activo) {
      return res.status(400).json({ exito: false, mensaje: 'La cuenta del usuario ya se encuentra activa' });
    }

    usuario.activo = true;
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    await usuario.save();

    res.status(200).json({
      exito: true,
      mensaje: `Cuenta del usuario ${usuario.nombre} reactivada exitosamente`,
      datos: {
        usuario: { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo, activo: usuario.activo }
      }
    });
  } catch (error) {
    console.error('Error al reactivar usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al reactivar la cuenta del usuario' });
  }
};

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  cambiarRolUsuario,
  desactivarUsuario,
  reactivarUsuario
};
