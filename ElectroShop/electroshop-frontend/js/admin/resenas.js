// ============================================
// ElectroShop Admin - Reseñas (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAdmin()) return;
    renderNavbarAdmin('resenas');

    var esc = escaparHtml;
    var paginaActual = 1;

    function estrellas(n) {
        var s = '';
        for (var i = 1; i <= 5; i++) s += (i <= n ? '★' : '☆');
        return '<span style="color:#f5a623">' + s + '</span>';
    }

    async function cargar() {
        var $tbody = $('#tablaBody');
        var params = '?pagina=' + paginaActual + '&limite=20';
        var estado = $('#fEstado').val();
        if (estado) params += '&estado=' + estado;

        var r = await apiListarResenasAdmin(params);
        if (!r.exito) { $tbody.html('<tr><td colspan="6" class="text-center text-muted">Error</td></tr>'); return; }

        var resenas = r.datos.resenas;
        if (resenas.length === 0) {
            $tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay reseñas</td></tr>');
            $('#paginacion').html('');
            return;
        }

        $tbody.html(resenas.map(function(re) {
            var prod = re.producto ? re.producto.nombre : '—';
            var verif = re.compraVerificada ? ' <span class="badge badge-success" style="font-size:0.6rem">Compra verificada</span>' : '';
            var estBadge = re.estado === 'publicada' ? '<span class="badge badge-success">Publicada</span>' : '<span class="badge badge-danger">Oculta</span>';
            var accion = re.estado === 'publicada'
                ? '<button class="btn btn-sm btn-outline" data-action="moderar" data-id="' + esc(re._id) + '" data-estado="oculta">Ocultar</button>'
                : '<button class="btn btn-sm btn-primary" data-action="moderar" data-id="' + esc(re._id) + '" data-estado="publicada">Publicar</button>';
            return '<tr>' +
                '<td>' + esc(prod) + '</td>' +
                '<td>' + esc(re.nombreUsuario || '—') + verif + '</td>' +
                '<td>' + estrellas(re.calificacion) + '</td>' +
                '<td style="max-width:280px;font-size:0.82rem">' + (re.comentario ? esc(re.comentario) : '<span class="text-muted">(sin comentario)</span>') + '</td>' +
                '<td>' + estBadge + '</td>' +
                '<td>' + accion + ' <button class="btn btn-sm btn-danger" data-action="eliminar-resena" data-id="' + esc(re._id) + '">🗑️</button></td>' +
                '</tr>';
        }).join(''));

        var pag = r.datos.paginacion;
        var h = 'Página ' + esc(pag.pagina) + ' de ' + esc(pag.totalPaginas) + ' (' + esc(pag.total) + ') ';
        if (pag.pagina > 1) h += '<button class="btn btn-sm btn-outline" data-action="ir-pagina" data-pagina="' + (pag.pagina - 1) + '">← Anterior</button> ';
        if (pag.pagina < pag.totalPaginas) h += '<button class="btn btn-sm btn-outline" data-action="ir-pagina" data-pagina="' + (pag.pagina + 1) + '">Siguiente →</button>';
        $('#paginacion').html(h);
    }

    function irPagina(n) { paginaActual = n; cargar(); }

    async function moderar(id, estado) {
        var r = await apiModerarResena(id, estado);
        if (r.exito) mostrarAlerta('alerta', 'success', r.mensaje); else mostrarAlerta('alerta', 'danger', r.mensaje);
        cargar();
    }
    async function eliminar(id) {
        if (!confirm('¿Eliminar esta reseña permanentemente?')) return;
        var r = await apiEliminarResena(id);
        if (r.exito) mostrarAlerta('alerta', 'success', 'Reseña eliminada'); else mostrarAlerta('alerta', 'danger', r.mensaje);
        cargar();
    }

    // === Handlers delegados (antes onclick/onchange inline) ===
    $(document).on('change', '#fEstado', function() { cargar(); });
    $(document).on('click', '[data-action="ir-pagina"]', function() {
        irPagina(parseInt($(this).attr('data-pagina'), 10));
    });
    $(document).on('click', '[data-action="moderar"]', function() {
        moderar($(this).attr('data-id'), $(this).attr('data-estado'));
    });
    $(document).on('click', '[data-action="eliminar-resena"]', function() {
        eliminar($(this).attr('data-id'));
    });

    $.extend(window, { cargar: cargar, irPagina: irPagina, moderar: moderar, eliminar: eliminar });

    cargar();
});
