// ============================================
// ElectroShop Vendedor - Mis Ventas (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereVendedor()) return;
    renderNavbarVendedor('ventas');

    var esc = escaparHtml;

    async function cargar() {
        var $cont = $('#lista');
        var r = await apiVendedorVentas();
        if (!r.exito) { $cont.html('<p class="text-muted">Error al cargar.</p>'); return; }

        $('#totalVendido').html(
            '<div style="font-size:1.6rem;font-weight:700;color:var(--success)">' + formatPrecio(r.datos.totalVendido) + '</div>' +
            '<div class="text-muted" style="font-size:0.8rem">Total vendido (pedidos confirmados)</div>');

        var ventas = r.datos.ventas;
        if (ventas.length === 0) { $cont.html('<p class="text-muted">Aún no tienes ventas.</p>'); return; }

        $cont.html(ventas.map(function(v) {
            var lineas = v.lineas.map(function(l) {
                return '<div style="display:flex;justify-content:space-between;font-size:0.85rem"><span>' + esc(l.cantidad) + '× ' + esc(l.nombre) + '</span><span>' + formatPrecio(l.subtotal) + '</span></div>';
            }).join('');
            return '<div class="card" style="margin-bottom:0.75rem">' +
                '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<strong>' + esc(v.numero) + '</strong>' + estadoPedidoBadge(v.estado) + '</div>' +
                '<div class="text-muted" style="font-size:0.78rem;margin:0.2rem 0 0.5rem">' + formatFecha(v.fecha) + ' · Cliente: ' + esc(v.cliente) + '</div>' +
                lineas +
                '<hr style="margin:0.5rem 0"><div style="display:flex;justify-content:space-between;font-weight:700"><span>Tu subtotal</span><span style="color:var(--primary)">' + formatPrecio(v.subtotalVendedor) + '</span></div>' +
                '</div>';
        }).join(''));
    }

    window.cargar = cargar;

    cargar();
});
