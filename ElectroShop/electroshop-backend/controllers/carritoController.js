const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');

// Constantes de negocio (IVA Costa Rica + envío fijo simulado)
const TASA_IMPUESTO = 0.13;
const COSTO_ENVIO = 2500;
const ENVIO_GRATIS_DESDE = 50000; // envío gratis por encima de este subtotal

// Obtiene (o crea) el carrito del usuario, con productos poblados
async function obtenerOCrear(usuarioId) {
  let carrito = await Carrito.findOne({ usuario: usuarioId });
  if (!carrito) carrito = await Carrito.create({ usuario: usuarioId, items: [] });
  return carrito;
}

// Construye la respuesta del carrito con totales calculados en vivo
async function construirRespuestaCarrito(carrito) {
  await carrito.populate('items.producto', 'nombre precio stock imagenes marca activo condicion');

  const items = [];
  let subtotal = 0;
  let huboCambios = false;

  // Filtrar productos eliminados/inactivos y recalcular precios actuales
  for (const item of carrito.items) {
    const p = item.producto;
    if (!p || !p.activo) {
      huboCambios = true; // producto ya no disponible -> se quita
      continue;
    }
    // Ajustar cantidad si excede el stock actual
    let cantidad = item.cantidad;
    if (cantidad > p.stock) {
      cantidad = p.stock;
      huboCambios = true;
    }
    if (cantidad <= 0) {
      huboCambios = true;
      continue;
    }

    const precioUnitario = p.precio; // precio actual (en vivo)
    const lineaSubtotal = precioUnitario * cantidad;
    subtotal += lineaSubtotal;

    items.push({
      producto: p._id,
      nombre: p.nombre,
      marca: p.marca,
      imagen: p.imagenes && p.imagenes.length ? p.imagenes[0].url : null,
      precioUnitario,
      cantidad,
      stockDisponible: p.stock,
      subtotal: lineaSubtotal
    });
  }

  // Si hubo ajustes, persistir el carrito saneado
  if (huboCambios) {
    carrito.items = items.map((i) => ({
      producto: i.producto,
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario
    }));
    await carrito.save();
  }

  const envio = subtotal === 0 || subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO;
  const impuesto = Math.round(subtotal * TASA_IMPUESTO);
  const total = subtotal + impuesto + envio;

  return {
    items,
    resumen: {
      cantidadItems: items.reduce((s, i) => s + i.cantidad, 0),
      subtotal,
      impuesto,
      envio,
      total,
      envioGratisDesde: ENVIO_GRATIS_DESDE
    },
    ajustado: huboCambios
  };
}

// GET /api/carrito
const obtenerCarrito = async (req, res) => {
  try {
    const carrito = await obtenerOCrear(req.usuario._id);
    const datos = await construirRespuestaCarrito(carrito);
    res.status(200).json({ exito: true, datos });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener el carrito' });
  }
};

// POST /api/carrito/items   body: { productoId, cantidad }
const agregarItem = async (req, res) => {
  try {
    const { productoId, cantidad } = req.body;
    const cant = parseInt(cantidad) || 1;

    if (!productoId) {
      return res.status(400).json({ exito: false, mensaje: 'Debe indicar el producto' });
    }
    if (cant < 1) {
      return res.status(400).json({ exito: false, mensaje: 'La cantidad debe ser al menos 1' });
    }

    const producto = await Producto.findById(productoId);
    if (!producto || !producto.activo) {
      return res.status(404).json({ exito: false, mensaje: 'Producto no disponible' });
    }

    const carrito = await obtenerOCrear(req.usuario._id);
    const existente = carrito.items.find((i) => i.producto.toString() === productoId);
    const cantidadActual = existente ? existente.cantidad : 0;
    const cantidadNueva = cantidadActual + cant;

    if (cantidadNueva > producto.stock) {
      return res.status(400).json({
        exito: false,
        mensaje: `Stock insuficiente. Disponible: ${producto.stock}, en carrito: ${cantidadActual}`
      });
    }

    if (existente) {
      existente.cantidad = cantidadNueva;
      existente.precioUnitario = producto.precio;
    } else {
      carrito.items.push({ producto: productoId, cantidad: cant, precioUnitario: producto.precio });
    }
    await carrito.save();

    const datos = await construirRespuestaCarrito(carrito);
    res.status(200).json({ exito: true, mensaje: 'Producto agregado al carrito', datos });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al agregar el producto al carrito' });
  }
};

// PUT /api/carrito/items/:productoId   body: { cantidad }
const actualizarItem = async (req, res) => {
  try {
    const { productoId } = req.params;
    const cant = parseInt(req.body.cantidad);

    if (!cant || cant < 1) {
      return res.status(400).json({ exito: false, mensaje: 'La cantidad debe ser al menos 1' });
    }

    const producto = await Producto.findById(productoId);
    if (!producto || !producto.activo) {
      return res.status(404).json({ exito: false, mensaje: 'Producto no disponible' });
    }
    if (cant > producto.stock) {
      return res.status(400).json({ exito: false, mensaje: `Stock insuficiente. Disponible: ${producto.stock}` });
    }

    const carrito = await obtenerOCrear(req.usuario._id);
    const item = carrito.items.find((i) => i.producto.toString() === productoId);
    if (!item) {
      return res.status(404).json({ exito: false, mensaje: 'El producto no está en el carrito' });
    }
    item.cantidad = cant;
    item.precioUnitario = producto.precio;
    await carrito.save();

    const datos = await construirRespuestaCarrito(carrito);
    res.status(200).json({ exito: true, mensaje: 'Carrito actualizado', datos });
  } catch (error) {
    console.error('Error al actualizar carrito:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al actualizar el carrito' });
  }
};

// DELETE /api/carrito/items/:productoId
const eliminarItem = async (req, res) => {
  try {
    const { productoId } = req.params;
    const carrito = await obtenerOCrear(req.usuario._id);
    carrito.items = carrito.items.filter((i) => i.producto.toString() !== productoId);
    await carrito.save();

    const datos = await construirRespuestaCarrito(carrito);
    res.status(200).json({ exito: true, mensaje: 'Producto eliminado del carrito', datos });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al eliminar el producto del carrito' });
  }
};

// DELETE /api/carrito  -> vaciar
const vaciarCarrito = async (req, res) => {
  try {
    const carrito = await obtenerOCrear(req.usuario._id);
    carrito.items = [];
    await carrito.save();
    const datos = await construirRespuestaCarrito(carrito);
    res.status(200).json({ exito: true, mensaje: 'Carrito vaciado', datos });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al vaciar el carrito' });
  }
};

module.exports = {
  obtenerCarrito,
  agregarItem,
  actualizarItem,
  eliminarItem,
  vaciarCarrito,
  // exportados para reuso en pedidos
  _helpers: { obtenerOCrear, construirRespuestaCarrito, TASA_IMPUESTO, COSTO_ENVIO, ENVIO_GRATIS_DESDE }
};
