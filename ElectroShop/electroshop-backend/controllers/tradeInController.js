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

module.exports = {
  crearSolicitud,
  misSolicitudes,
  detalleSolicitud,
  listarAdmin,
  evaluarSolicitud
};
