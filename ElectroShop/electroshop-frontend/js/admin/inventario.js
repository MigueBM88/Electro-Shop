// ============================================
// ElectroShop Admin - Inventario (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAdmin()) return;
    renderNavbarAdmin('inventario');

    var esc = escaparHtml;

    async function cargarKpis() {
        var r = await apiInventarioResumen();
        if (!r.exito) return;
        var k = r.datos.resumen;
        function card(titulo, valor, color) {
            return '<div class="card" style="text-align:center;padding:1rem">' +
                '<div style="font-size:1.6rem;font-weight:700;color:' + (color || 'var(--primary)') + '">' + esc(valor) + '</div>' +
                '<div class="text-muted" style="font-size:0.8rem">' + titulo + '</div></div>';
        }
        $('#kpis').html(
            card('Productos', k.totalProductos) +
            card('Activos', k.activos, 'var(--success)') +
            card('Bajo stock', k.bajoStock, 'var(--warning)') +
            card('Agotados', k.agotados, 'var(--danger)') +
            card('Unidades totales', k.unidadesTotales) +
            card('Valor inventario', formatPrecio(k.valorInventario)));
    }

    async function cargarAlertas() {
        var $tbody = $('#tablaAlertas');
        limpiarDataTable('#tablaInventario');
        var r = await apiInventarioAlertas();
        if (!r.exito) { $tbody.html('<tr><td colspan="4" class="text-center text-muted">Error</td></tr>'); return; }
        var ps = r.datos.productos;
        if (ps.length === 0) {
            $tbody.html('<tr><td colspan="4" class="text-center text-muted">✅ Ningún producto con stock bajo. ¡Todo en orden!</td></tr>');
            return;
        }
        $tbody.html(ps.map(function(p) {
            var cat = p.categoria ? p.categoria.nombre : '—';
            return '<tr>' +
                '<td><strong>' + esc(p.nombre) + '</strong><br><span class="text-muted" style="font-size:0.72rem">SKU: ' + esc(p.sku || '—') + '</span></td>' +
                '<td>' + esc(cat) + '</td>' +
                '<td data-order="' + esc(p.stock) + '">' + stockBadge(p.stock) + '</td>' +
                '<td><button class="btn btn-sm btn-primary" data-action="abrir-ajuste" data-id="' + esc(p._id) + '" data-nombre="' + esc(p.nombre) + '">Ajustar</button></td>' +
                '</tr>';
        }).join(''));

        // DataTables: búsqueda, orden y paginación (stock más bajo primero)
        activarDataTable('#tablaInventario', {
            order: [[2, 'asc']],
            columnDefs: [{ targets: 3, orderable: false, searchable: false }]
        });
    }

    function abrirAjuste(id, nombre) {
        $('#ajusteProdId').val(id);
        $('#ajusteTitulo').text('Ajustar: ' + nombre);
        $('#ajusteCantidad').val(0);
        $('#ajusteMotivo').val('');
        $('#modalAjuste').addClass('visible');
    }
    function cerrarModal() { $('#modalAjuste').removeClass('visible'); }

    async function guardarAjuste() {
        var datos = {
            productoId: $('#ajusteProdId').val(),
            tipo: $('#ajusteTipo').val(),
            cantidad: parseInt($('#ajusteCantidad').val()) || 0,
            motivo: $('#ajusteMotivo').val().trim()
        };
        var r = await apiAjustarStock(datos);
        if (r.exito) {
            mostrarAlerta('alerta', 'success', 'Stock actualizado: ' + r.datos.producto.nombre + ' → ' + r.datos.producto.stock);
            cerrarModal(); cargarKpis(); cargarAlertas();
        } else {
            mostrarAlerta('alerta', 'danger', r.mensaje);
        }
    }

    // === Handlers delegados (antes onclick inline) ===
    $(document).on('click', '[data-action="abrir-ajuste"]', function() {
        abrirAjuste($(this).attr('data-id'), $(this).attr('data-nombre'));
    });
    $(document).on('click', '[data-action="cerrar-modal"]', function() { cerrarModal(); });
    $(document).on('click', '[data-action="guardar-ajuste"]', function() { guardarAjuste(); });

    $.extend(window, {
        cargarKpis: cargarKpis,
        cargarAlertas: cargarAlertas,
        abrirAjuste: abrirAjuste,
        cerrarModal: cerrarModal,
        guardarAjuste: guardarAjuste
    });

    cargarKpis();
    cargarAlertas();
});
