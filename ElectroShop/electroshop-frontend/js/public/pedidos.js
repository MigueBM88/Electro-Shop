// ============================================
// ElectroShop - Mis Pedidos (migrado a jQuery)
// ============================================
$(function() {
    construirFooterES();
    if (!requiereAuth()) return;
    renderNavbar('pedidos');

    var esc = escaparHtml;

    async function cargar() {
        var $cont = $('#contenido');
        mostrarSpinner();
        try {
            var r = await apiMisPedidos();
            if (!r.exito) { $cont.html('<p class="text-muted">No se pudieron cargar los pedidos.</p>'); return; }

            var pedidos = r.datos.pedidos;
            if (pedidos.length === 0) {
                $cont.html('<div class="card text-center" style="padding:2rem">' +
                    '<p style="font-size:3rem;margin:0">📦</p>' +
                    '<p class="text-muted">Aún no has realizado pedidos.</p>' +
                    '<a href="catalogo.html" class="btn btn-primary btn-sm" style="width:auto;margin:0 auto">Ir al catálogo</a>' +
                    '</div>');
                return;
            }

            $cont.html('<div class="card"><div class="table-container"><table>' +
                '<thead><tr><th>Pedido</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th><th></th></tr></thead>' +
                '<tbody>' + pedidos.map(function(p) {
                    var numItems = p.items.reduce(function(s, i) { return s + i.cantidad; }, 0);
                    return '<tr>' +
                        '<td><strong>' + esc(p.numero) + '</strong></td>' +
                        '<td>' + formatFecha(p.createdAt) + '</td>' +
                        '<td>' + esc(numItems) + ' artículo(s)</td>' +
                        '<td><strong>' + formatPrecio(p.total) + '</strong></td>' +
                        '<td>' + estadoPedidoBadge(p.estado) + '</td>' +
                        '<td><a href="pedido.html?id=' + encodeURIComponent(p._id) + '" class="btn btn-sm btn-outline">Ver detalle</a></td>' +
                        '</tr>';
                }).join('') + '</tbody></table></div></div>');
        } catch (e) {
            $cont.html('<p class="text-muted">Error de conexión con el servidor.</p>');
        } finally {
            ocultarSpinner();
        }
    }

    window.cargar = cargar;
    cargar();
});
