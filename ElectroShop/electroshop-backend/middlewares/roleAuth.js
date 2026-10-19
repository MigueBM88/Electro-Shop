const autorizarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Debe autenticarse primero'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        exito: false,
        mensaje: `El rol '${req.usuario.rol}' no tiene permisos para acceder a este recurso`
      });
    }

    next();
  };
};

module.exports = { autorizarRol };
