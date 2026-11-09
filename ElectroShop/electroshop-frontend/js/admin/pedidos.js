// ============================================
// ElectroShop Admin - Pedidos (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAdmin()) return;
    renderNavbarAdmin('pedidos');

    var esc = escaparHtml;
    var paginaActual = 1;

    async function cargar() {
        var $tbody = $('#tablaBody');
        var params = '?pagina=1&limite=1000'; // DataTables pagina en el navegador
        var estado = $('#fEstado').val();
        if (estado) params += '&estado=' + estado;

        limpiarDataTable('#tablaPedidos');
        mostrarSpinner();
        try {
            var r = await apiListarPedidosAdmin(params);
            if (!r.exito) { $tbody.html('<tr><td colspan="7" class="text-center text-muted">Error al cargar</td></tr>'); return; }

            var pedidos = r.datos.pedidos;
            if (pedidos.length === 0) {
                $tbody.html('<tr><td colspan="7" class="text-center text-muted">No hay pedidos</td></tr>');
                return;
            }

            $tbody.html(pedidos.map(function(p) {
                var cliente = p.usuario ? (esc(p.usuario.nombre) + '<br><span class="text-muted" style="font-size:0.72rem">' + esc(p.usuario.correo) + '</span>') : '—';
                var pagoMap = { aprobado: 'badge-success', pendiente: 'badge-warning', rechazado: 'badge-danger' };
                var pagoBadge = '<span class="badge ' + (pagoMap[p.pago.estado] || 'badge-primary') + '">' + esc(p.pago.estado) + '</span>';

                var opciones = ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'].map(function(e) {
                    return '<option value="' + e + '"' + (e === p.estado ? ' selected' : '') + '>' + e + '</option>';
                }).join('');

                return '<tr>' +
                    '<td><strong>' + esc(p.numero) + '</strong></td>' +
                    '<td>' + cliente + '</td>' +
                    '<td data-order="' + esc(p.createdAt) + '">' + formatFecha(p.createdAt) + '</td>' +
                    '<td data-order="' + esc(p.total) + '"><strong>' + formatPrecio(p.total) + '</strong></td>' +
                    '<td>' + pagoBadge + '</td>' +
                    '<td>' + estadoPedidoBadge(p.estado) + '</td>' +
                    '<td><select class="js-cambiar-estado" data-id="' + esc(p._id) + '" style="min-width:130px">' + opciones + '</select></td>' +
                    '</tr>';
            }).join(''));

            // DataTables: búsqueda, orden y paginación
            activarDataTable('#tablaPedidos', {
                order: [[2, 'desc']],
                columnDefs: [{ targets: 6, orderable: false, searchable: false }]
            });
        } catch (e) {
            $tbody.html('<tr><td colspan="7" class="text-center text-muted">Error de conexión</td></tr>');
        } finally {
            ocultarSpinner();
        }
    }

    async function cambiarEstado(id, estado) {
        var r = await apiActualizarEstadoPedido(id, estado);
        if (r.exito) mostrarAlerta('alerta', 'success', 'Estado actualizado a "' + estado + '"');
        else mostrarAlerta('alerta', 'danger', r.mensaje);
        cargar();
    }

    // === Handlers delegados (antes onchange inline) ===
    $(document).on('change', '#fEstado', function() { cargar(); });
    $(document).on('change', 'select.js-cambiar-estado', function() {
        cambiarEstado($(this).attr('data-id'), $(this).val());
    });

    $.extend(window, { cargar: cargar, cambiarEstado: cambiarEstado });

    cargar();
});
