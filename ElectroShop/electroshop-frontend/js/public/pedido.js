// ============================================
// ElectroShop - Detalle de pedido (migrado a jQuery)
// ============================================
$(function() {
    construirFooterES();
    if (!requiereAuth()) return;
    renderNavbar('pedidos');

    var esc = escaparHtml;
    var params = new URLSearchParams(window.location.search);
    var pedidoId = params.get('id');
    var esNuevo = params.get('nuevo') === '1';

    async function cargar() {
        var $cont = $('#contenido');
        if (!pedidoId) { $cont.html('<p class="text-muted">Pedido no especificado.</p>'); return; }

        mostrarSpinner();
        try {
            var r = await apiDetallePedido(pedidoId);
            if (!r.exito) { $cont.html('<p class="text-muted">' + esc(r.mensaje || 'Pedido no encontrado') + '</p>'); return; }
            var p = r.datos.pedido;

            if (esNuevo) {
                mostrarAlerta('alerta', 'success', '🎉 ' + (p.pago.estado === 'aprobado' ? '¡Pago aprobado! ' : '') + 'Tu pedido ' + p.numero + ' fue registrado correctamente.');
            }

            var dir = p.direccionEnvio || {};
            var dirTxt = [dir.provincia, dir.canton, dir.distrito, dir.detalle].filter(Boolean).join(', ') || 'No especificada';

            var itemsHTML = p.items.map(function(i) {
                return '<tr><td>' + esc(i.nombre) + '<br><span class="text-muted" style="font-size:0.72rem">SKU: ' + esc(i.sku || '—') + '</span></td>' +
                    '<td>' + formatPrecio(i.precioUnitario) + '</td>' +
                    '<td>' + esc(i.cantidad) + '</td>' +
                    '<td><strong>' + formatPrecio(i.subtotal) + '</strong></td></tr>';
            }).join('');

            var puedeCancelar = ['pendiente', 'pagado', 'preparando'].indexOf(p.estado) !== -1;

            $cont.html(
                '<div class="es-pedido-head">' +
                  '<h2 style="margin:0">Pedido ' + esc(p.numero) + '</h2>' + estadoPedidoBadge(p.estado) +
                '</div>' +
                '<p class="text-muted" style="font-size:0.8rem">Realizado el ' + formatFecha(p.createdAt) + '</p>' +

                '<div class="card">' + timelinePedido(p.estado) + '</div>' +

                '<div class="es-pedido-grid">' +
                  '<div class="card"><h3 style="margin-bottom:0.75rem">Productos</h3>' +
                    '<div class="table-container"><table>' +
                    '<thead><tr><th>Producto</th><th>Precio</th><th>Cant.</th><th>Subtotal</th></tr></thead>' +
                    '<tbody>' + itemsHTML + '</tbody></table></div>' +
                  '</div>' +

                  '<div>' +
                    '<div class="card">' +
                      '<h3 style="margin-bottom:0.5rem">Resumen</h3>' +
                      fila('Subtotal', formatPrecio(p.subtotal)) +
                      fila('IVA (13%)', formatPrecio(p.impuesto)) +
                      fila('Envío', p.envio === 0 ? 'GRATIS' : formatPrecio(p.envio)) +
                      '<hr style="margin:0.5rem 0">' +
                      '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.05rem"><span>Total</span><span style="color:var(--primary)">' + formatPrecio(p.total) + '</span></div>' +
                    '</div>' +
                    '<div class="card" style="margin-top:1rem">' +
                      '<h3 style="margin-bottom:0.5rem">Envío y pago</h3>' +
                      '<p style="font-size:0.85rem;margin-bottom:0.3rem"><strong>Dirección:</strong> ' + esc(dirTxt) + '</p>' +
                      '<p style="font-size:0.85rem;margin-bottom:0.3rem"><strong>Método:</strong> ' + esc(metodoTxt(p.metodoPago)) + '</p>' +
                      '<p style="font-size:0.85rem"><strong>Pago:</strong> ' + pagoBadge(p.pago.estado) + '</p>' +
                    '</div>' +
                    (puedeCancelar ? '<button class="btn btn-danger btn-sm" style="margin-top:1rem" data-action="cancelar-pedido">Cancelar pedido</button>' : '') +
                  '</div>' +
                '</div>');
        } catch (e) {
            $cont.html('<p class="text-muted">Error de conexión con el servidor.</p>');
        } finally {
            ocultarSpinner();
        }
    }

    function fila(l, v) { return '<div style="display:flex;justify-content:space-between;margin-bottom:0.4rem"><span>' + l + '</span><span>' + v + '</span></div>'; }
    function metodoTxt(m) { return { tarjeta: 'Tarjeta', sinpe: 'SINPE Móvil', contra_entrega: 'Contra entrega' }[m] || m; }
    function pagoBadge(e) {
        var map = { aprobado: 'badge-success', pendiente: 'badge-warning', rechazado: 'badge-danger' };
        var txt = { aprobado: 'Aprobado', pendiente: 'Pendiente', rechazado: 'Rechazado' };
        return '<span class="badge ' + (map[e] || 'badge-primary') + '">' + esc(txt[e] || e) + '</span>';
    }

    async function cancelar() {
        if (!(await confirmarModal('¿Seguro que deseas cancelar este pedido? El stock será repuesto.'))) return;
        var r = await apiCancelarPedido(pedidoId);
        if (r.exito) { mostrarAlerta('alerta', 'success', 'Pedido cancelado'); cargar(); }
        else mostrarErrorModal(r.mensaje);
    }

    // === Handler delegado (antes onclick inline) ===
    $(document).on('click', '[data-action="cancelar-pedido"]', function() { cancelar(); });

    $.extend(window, { cargar: cargar, cancelar: cancelar });

    cargar();
});
