const TradeIn = require('../models/TradeIn');

// POST /api/tradein  (cliente) -> crear solicitud
const crearSolicitud = async (req, res) => {
  try {
    const { nombreEquipo, descripcion, condicionDeclarada, imagenesUrls, precioEstimadoCliente } = req.body;

    if (!nombreEquipo || !descripcion) {
      return res.status(400).json({ exito: false, mensaje: 'El nombre y la descripción del equipo son obligatorios' });
    }

    const solicitud = await TradeIn.create({
      usuario: req.usuario._id,
      nombreEquipo,
      descripcion,
      condicionDeclarada: condicionDeclarada || 'bueno',
      imagenesUrls: Array.isArray(imagenesUrls) ? imagenesUrls : [],
      precioEstimadoCliente: precioEstimadoCliente ? Number(precioEstimadoCliente) : null,
      estado: 'solicitado',
      historial: [{ estado: 'solicitado', nota: 'Solicitud creada por el cliente' }]
    });

    res.status(201).json({ exito: true, mensaje: 'Solicitud de Trade-In enviada', datos: { solicitud } });
  } catch (error) {
    console.error('Error al crear solicitud trade-in:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al crear la solicitud de Trade-In' });
  }
};

// GET /api/tradein/mias  (cliente) -> solicitudes del usuario
const misSolicitudes = async (req, res) => {
  try {
    const solicitudes = await TradeIn.find({ usuario: req.usuario._id }).sort({ createdAt: -1 });
    res.status(200).json({ exito: true, datos: { solicitudes } });
  } catch (error) {
    console.error('Error al listar mis trade-ins:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener tus solicitudes' });
  }
};

// GET /api/tradein/:id  (dueño o admin)
const detalleSolicitud = async (req, res) => {
  try {
    const solicitud = await TradeIn.findById(req.params.id).populate('usuario', 'nombre correo');
    if (!solicitud) return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada' });
    const esDueno = solicitud.usuario._id.toString() === req.usuario._id.toString();
    if (!esDueno && req.usuario.rol !== 'admin') {
      return res.status(403).json({ exito: false, mensaje: 'Sin permiso para ver esta solicitud' });
    }
    res.status(200).json({ exito: true, datos: { solicitud } });
  } catch (error) {
    console.error('Error al obtener trade-in:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener la solicitud' });
  }
};

// ============================================
// ADMIN
// ============================================

// GET /api/tradein/admin/lista
const listarAdmin = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;
    const salto = (pagina - 1) * limite;

    const filtro = {};
    if (req.query.estado) filtro.estado = req.query.estado;

    const [solicitudes, total] = await Promise.all([
      TradeIn.find(filtro).populate('usuario', 'nombre correo').sort({ createdAt: -1 }).skip(salto).limit(limite),
      TradeIn.countDocuments(filtro)
    ]);

    res.status(200).json({
      exito: true,
      datos: { solicitudes, paginacion: { total, pagina, limite, totalPaginas: Math.ceil(total / limite) || 1 } }
    });
  } catch (error) {
    console.error('Error al listar trade-ins (admin):', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las solicitudes' });
  }
};

// PUT /api/tradein/:id/evaluar  (admin)  body: { estado, ofertaAdmin?, notaAdmin? }
const evaluarSolicitud = async (req, res) => {
  try {
    const { estado, ofertaAdmin, notaAdmin } = req.body;
    const estadosValidos = ['en_revision', 'aprobado', 'rechazado', 'contraoferta'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado de evaluación inválido' });
    }

    const solicitud = await TradeIn.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada' });

    solicitud.estado = estado;
    // Una nueva evaluación del admin reinicia la respuesta del cliente
    solicitud.respuestaCliente = null;
    if (ofertaAdmin !== undefined && ofertaAdmin !== null && ofertaAdmin !== '') {
      solicitud.ofertaAdmin = Number(ofertaAdmin);
    }
    if (notaAdmin !== undefined) solicitud.notaAdmin = notaAdmin;
    solicitud.historial.push({ estado, nota: notaAdmin || `Evaluación: ${estado}` });
    await solicitud.save();

    res.status(200).json({ exito: true, mensaje: 'Solicitud evaluada', datos: { solicitud } });
  } catch (error) {
    console.error('Error al evaluar trade-in:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al evaluar la solicitud' });
  }
};

// PUT /api/tradein/:id/responder  (cliente dueño)
// body: { aceptar: true|false }  o  { montoPropuesto: number }  (el cliente propone otro monto)
// Solo se puede responder cuando el estado es 'contraoferta'.
const responderContraoferta = async (req, res) => {
  try {
    const { aceptar, montoPropuesto } = req.body;
    const proponeMonto = montoPropuesto !== undefined && montoPropuesto !== null && montoPropuesto !== '';
    if (!proponeMonto && typeof aceptar !== 'boolean') {
      return res.status(400).json({ exito: false, mensaje: 'Debes aceptar, rechazar o proponer otro monto' });
    }

    const solicitud = await TradeIn.findById(req.params.id);
    if (!solicitud) return res.status(404).json({ exito: false, mensaje: 'Solicitud no encontrada' });
    if (solicitud.usuario.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ exito: false, mensaje: 'Sin permiso para responder esta solicitud' });
    }
    if (solicitud.estado !== 'contraoferta') {
      return res.status(400).json({ exito: false, mensaje: 'Esta solicitud no tiene una contraoferta pendiente' });
    }

    if (proponeMonto) {
      const monto = Number(montoPropuesto);
      if (isNaN(monto) || monto < 0) {
        return res.status(400).json({ exito: false, mensaje: 'El monto propuesto debe ser un número mayor o igual a 0' });
      }
      // Vuelve a revisión para que el admin evalúe la propuesta del cliente
      solicitud.estado = 'en_revision';
      solicitud.respuestaCliente = 'contraoferta';
      solicitud.contraofertaCliente = monto;
      solicitud.historial.push({ estado: 'en_revision', nota: `El cliente propuso un nuevo monto: ${monto}` });
      await solicitud.save();
      return res.status(200).json({ exito: true, mensaje: 'Propuesta enviada', datos: { solicitud } });
    }

    solicitud.estado = aceptar ? 'aprobado' : 'rechazado';
    solicitud.respuestaCliente = aceptar ? 'aceptada' : 'rechazada';
    solicitud.historial.push({
      estado: solicitud.estado,
      nota: aceptar ? 'El cliente aceptó la contraoferta' : 'El cliente rechazó la contraoferta'
    });
    await solicitud.save();

    res.status(200).json({
      exito: true,
      mensaje: aceptar ? 'Contraoferta aceptada' : 'Contraoferta rechazada',
      datos: { solicitud }
    });
  } catch (error) {
    console.error('Error al responder contraoferta:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al responder la contraoferta' });
  }
};

module.exports = {
  responderContraoferta,
  crearSolicitud,
  misSolicitudes,
  detalleSolicitud,
  listarAdmin,
  evaluarSolicitud
};
