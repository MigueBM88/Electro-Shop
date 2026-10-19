const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protegerRuta = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        exito: false,
        mensaje: 'No autorizado. Debe iniciar sesión para acceder a este recurso'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await User.findById(decoded.id);

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'El usuario asociado a este token ya no existe'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Su cuenta ha sido desactivada. Contacte al administrador'
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ exito: false, mensaje: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token expirado. Inicie sesión nuevamente'
      });
    }
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar autenticación'
    });
  }
};

module.exports = { protegerRuta };
