const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { enviarCorreoConfirmacion } = require('../utils/emailService');

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// HU-1: REGISTRO DE USUARIO
const registrarUsuario = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación en los campos del formulario',
        errores: errores.array().map((err) => ({ campo: err.path, mensaje: err.msg }))
      });
    }

    const { nombre, correo, contrasena } = req.body;

    const usuarioExistente = await User.findOne({ correo });
    if (usuarioExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El correo electrónico ya se encuentra registrado',
        errores: [{ campo: 'correo', mensaje: 'Este correo ya está asociado a una cuenta existente' }]
      });
    }

    const tokenConfirmacion = crypto.randomBytes(32).toString('hex');

    const nuevoUsuario = await User.create({
      nombre,
      correo,
      contrasena,
      tokenConfirmacion,
      rol: 'cliente'
    });

    try {
      await enviarCorreoConfirmacion(nuevoUsuario, tokenConfirmacion);
    } catch (emailError) {
      console.error('Error al enviar correo de confirmación:', emailError);
    }

    const token = generarToken(nuevoUsuario._id);

    res.status(201).json({
      exito: true,
      mensaje: 'Registro exitoso. Se ha enviado un correo de confirmación a tu dirección de email',
      datos: {
        usuario: {
          id: nuevoUsuario._id,
          nombre: nuevoUsuario.nombre,
          correo: nuevoUsuario.correo,
          rol: nuevoUsuario.rol,
          fechaRegistro: nuevoUsuario.fechaRegistro
        },
        token
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El correo electrónico ya se encuentra registrado'
      });
    }
    res.status(500).json({ exito: false, mensaje: 'Error interno al procesar el registro' });
  }
};

// HU-2: INICIO DE SESIÓN
const iniciarSesion = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe completar todos los campos',
        errores: errores.array().map((err) => ({ campo: err.path, mensaje: err.msg }))
      });
    }

    const { correo, contrasena } = req.body;

    const usuario = await User.findOne({ correo }).select('+contrasena');

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Las credenciales ingresadas son inválidas'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Su cuenta ha sido desactivada. Contacte al administrador para más información'
      });
    }

    if (usuario.estaBloqueada()) {
      const minutosRestantes = usuario.tiempoRestanteBloqueo();
      return res.status(423).json({
        exito: false,
        mensaje: `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente nuevamente en ${minutosRestantes} minuto(s)`,
        bloqueadoHasta: usuario.bloqueadoHasta,
        minutosRestantes
      });
    }

    const contrasenaCorrecta = await usuario.compararContrasena(contrasena);
    if (!contrasenaCorrecta) {
      await usuario.registrarIntentoFallido();

      const intentosRestantes =
        (parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5) - usuario.intentosFallidos;

      if (usuario.estaBloqueada()) {
        const minutosRestantes = usuario.tiempoRestanteBloqueo();
        return res.status(423).json({
          exito: false,
          mensaje: `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente nuevamente en ${minutosRestantes} minuto(s)`,
          bloqueadoHasta: usuario.bloqueadoHasta,
          minutosRestantes
        });
      }

      return res.status(401).json({
        exito: false,
        mensaje: 'Las credenciales ingresadas son inválidas',
        intentosRestantes: intentosRestantes > 0 ? intentosRestantes : undefined
      });
    }

    await usuario.resetearIntentosFallidos();
    const token = generarToken(usuario._id);

    res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      datos: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
          ultimoAcceso: usuario.ultimoAcceso
        },
        token
      }
    });
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno al procesar el inicio de sesión' });
  }
};

// HU-3: OBTENER PERFIL
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario._id);
    res.status(200).json({
      exito: true,
      datos: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          telefono: usuario.telefono,
          direccion: usuario.direccion,
          rol: usuario.rol,
          correoConfirmado: usuario.correoConfirmado,
          fechaRegistro: usuario.fechaRegistro,
          ultimoAcceso: usuario.ultimoAcceso
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener los datos del perfil' });
  }
};

// HU-3: EDICIÓN DE PERFIL
const editarPerfil = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación en los campos del perfil',
        errores: errores.array().map((err) => ({ campo: err.path, mensaje: err.msg }))
      });
    }

    const camposPermitidos = ['nombre', 'telefono', 'direccion'];
    const datosActualizar = {};

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        datosActualizar[campo] = req.body[campo];
      }
    });

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.usuario._id,
      datosActualizar,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      exito: true,
      mensaje: 'Perfil actualizado exitosamente',
      datos: {
        usuario: {
          id: usuarioActualizado._id,
          nombre: usuarioActualizado.nombre,
          correo: usuarioActualizado.correo,
          telefono: usuarioActualizado.telefono,
          direccion: usuarioActualizado.direccion,
          rol: usuarioActualizado.rol
        }
      }
    });
  } catch (error) {
    console.error('Error al editar perfil:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar los datos del perfil' });
  }
};

// CAMBIO DE CONTRASEÑA
const cambiarContrasena = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array().map((err) => ({ campo: err.path, mensaje: err.msg }))
      });
    }

    const { contrasenaActual, nuevaContrasena } = req.body;
    const usuario = await User.findById(req.usuario._id).select('+contrasena');

    const esCorrecta = await usuario.compararContrasena(contrasenaActual);
    if (!esCorrecta) {
      return res.status(400).json({ exito: false, mensaje: 'La contraseña actual es incorrecta' });
    }

    usuario.contrasena = nuevaContrasena;
    await usuario.save();

    const token = generarToken(usuario._id);
    res.status(200).json({
      exito: true,
      mensaje: 'Contraseña actualizada exitosamente',
      datos: { token }
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al cambiar la contraseña' });
  }
};

// CONFIRMAR CORREO (HU-1)
const confirmarCorreo = async (req, res) => {
  try {
    const { token } = req.params;
    const usuario = await User.findOne({ tokenConfirmacion: token }).select('+tokenConfirmacion');

    if (!usuario) {
      return res.status(400).json({ exito: false, mensaje: 'Token de confirmación inválido o expirado' });
    }

    usuario.correoConfirmado = true;
    usuario.tokenConfirmacion = undefined;
    await usuario.save();

    res.status(200).json({
      exito: true,
      mensaje: 'Correo electrónico confirmado exitosamente. Ya puede iniciar sesión'
    });
  } catch (error) {
    console.error('Error al confirmar correo:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al confirmar el correo electrónico' });
  }
};

module.exports = {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  editarPerfil,
  cambiarContrasena,
  confirmarCorreo
};
