// ============================================
// ElectroShop - Carrito (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAuth()) return;
    renderNavbar('carrito');

    var esc = escaparHtml;

    async function cargarCarrito() {
        var $cont = $('#contenido');
        try {
            var r = await apiObtenerCarrito();
            if (!r.exito) { $cont.html('<p class="text-muted">No se pudo cargar el carrito.</p>'); return; }

            var d = r.datos;
            if (d.ajustado) {
                mostrarAlerta('alerta', 'warning', 'Algunos productos se ajustaron por cambios de stock o disponibilidad.');
            }

            if (d.items.length === 0) {
                $cont.html('<div class="card text-center" style="padding:2rem">' +
                    '<p style="font-size:3rem;margin:0">🛒</p>' +
                    '<p class="text-muted">Tu carrito está vacío.</p>' +
                    '<a href="catalogo.html" class="btn btn-primary btn-sm" style="width:auto;margin:0 auto">Ir al catálogo</a>' +
                    '</div>');
                return;
            }

            // Tabla de items
            var filas = d.items.map(function(i) {
                return '<tr>' +
                    '<td><strong>' + esc(i.nombre) + '</strong><br><span class="text-muted" style="font-size:0.75rem">' + esc(i.marca || '') + '</span></td>' +
                    '<td>' + formatPrecio(i.precioUnitario) + '</td>' +
                    '<td>' +
                    '<input type="number" class="js-cantidad-item" data-id="' + esc(i.producto) + '" min="1" max="' + esc(i.stockDisponible) + '" value="' + esc(i.cantidad) + '" style="width:70px">' +
                    '</td>' +
                    '<td><strong>' + formatPrecio(i.subtotal) + '</strong></td>' +
                    '<td><button class="btn btn-sm btn-danger" data-action="quitar-item" data-id="' + esc(i.producto) + '">🗑️</button></td>' +
                    '</tr>';
            }).join('');

            var res = d.resumen;
            var envioTxt = res.envio === 0 ? '<span class="badge badge-success">GRATIS</span>' : formatPrecio(res.envio);

            $cont.html(
                '<div class="card"><div class="table-container"><table>' +
                '<thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>' +
                '<tbody>' + filas + '</tbody></table></div></div>' +

                '<div class="card" style="max-width:360px;margin-left:auto;margin-top:1rem">' +
                '<h3 style="margin-bottom:0.75rem">Resumen</h3>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:0.4rem"><span>Subtotal</span><span>' + formatPrecio(res.subtotal) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:0.4rem"><span>IVA (13%)</span><span>' + formatPrecio(res.impuesto) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:0.4rem"><span>Envío</span><span>' + envioTxt + '</span></div>' +
                (res.envio > 0 ? '<p class="text-muted" style="font-size:0.72rem;margin-bottom:0.4rem">Envío gratis en compras desde ' + formatPrecio(res.envioGratisDesde) + '</p>' : '') +
                '<hr style="margin:0.5rem 0">' +
                '<div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;margin-bottom:0.75rem"><span>Total</span><span style="color:var(--primary)">' + formatPrecio(res.total) + '</span></div>' +
                '<a href="checkout.html" class="btn btn-primary" style="margin-bottom:0.5rem">Proceder al pago</a>' +
                '<button class="btn btn-outline btn-sm" data-action="vaciar-carrito">Vaciar carrito</button>' +
                '</div>');
        } catch (e) {
            $cont.html('<p class="text-muted">Error de conexión con el servidor.</p>');
        }
    }

    async function actualizarCantidad(id, cantidad) {
        var r = await apiActualizarItemCarrito(id, parseInt(cantidad));
        if (!r.exito) mostrarAlerta('alerta', 'danger', r.mensaje);
        cargarCarrito();
    }

    async function quitar(id) {
        var r = await apiEliminarItemCarrito(id);
        if (r.exito) mostrarAlerta('alerta', 'success', 'Producto eliminado del carrito');
        cargarCarrito();
    }

    async function vaciar() {
        if (!confirm('¿Vaciar todo el carrito?')) return;
        await apiVaciarCarrito();
        cargarCarrito();
    }

    // === Handlers delegados (antes onchange/onclick inline) ===
    $(document).on('change', 'input.js-cantidad-item', function() {
        actualizarCantidad($(this).attr('data-id'), $(this).val());
    });
    $(document).on('click', '[data-action="quitar-item"]', function() {
        quitar($(this).attr('data-id'));
    });
    $(document).on('click', '[data-action="vaciar-carrito"]', function() { vaciar(); });

    $.extend(window, {
        cargarCarrito: cargarCarrito,
        actualizarCantidad: actualizarCantidad,
        quitar: quitar,
        vaciar: vaciar
    });

    cargarCarrito();
});
