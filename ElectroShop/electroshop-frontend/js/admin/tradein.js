// ============================================
// ElectroShop Admin - Trade-In (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAdmin()) return;
    renderNavbarAdmin('tradein');

    var esc = escaparHtml;

    var ESTADO_TI = {
        solicitado: 'badge-warning', en_revision: 'badge-primary', aprobado: 'badge-success',
        rechazado: 'badge-danger', contraoferta: 'badge-warning'
    };
    function tiBadge(e) { return '<span class="badge ' + (ESTADO_TI[e] || 'badge-primary') + '">' + esc(e) + '</span>'; }

    async function cargar() {
        var $cont = $('#lista');
        var params = '';
        var estado = $('#fEstado').val();
        if (estado) params = '?estado=' + estado;
        var r = await apiListarTradeInAdmin(params);
        if (!r.exito) { $cont.html('<p class="text-muted">Error al cargar.</p>'); return; }
        var ss = r.datos.solicitudes;
        if (ss.length === 0) { $cont.html('<p class="text-muted">No hay solicitudes.</p>'); return; }

        $cont.html(ss.map(function(s) {
            var cliente = s.usuario ? (esc(s.usuario.nombre) + ' (' + esc(s.usuario.correo) + ')') : '—';
            var oferta = s.ofertaAdmin != null ? ' · Oferta: ' + formatPrecio(s.ofertaAdmin) : '';
            return '<div class="card" style="margin-bottom:0.75rem">' +
                '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<strong>' + esc(s.nombreEquipo) + '</strong>' + tiBadge(s.estado) + '</div>' +
                '<div class="text-muted" style="font-size:0.82rem;margin-top:0.3rem">' + esc(s.descripcion) + '</div>' +
                '<div style="font-size:0.8rem;margin-top:0.3rem">Cliente: ' + cliente + ' · Condición: ' + esc(s.condicionDeclarada) +
                (s.precioEstimadoCliente ? ' · Espera: ' + formatPrecio(s.precioEstimadoCliente) : '') + oferta + '</div>' +
                '<button class="btn btn-sm btn-primary" style="margin-top:0.5rem;width:auto" data-action="abrir-eval" data-id="' + esc(s._id) + '" data-nombre="' + esc(s.nombreEquipo) + '" data-oferta="' + esc(s.ofertaAdmin || 0) + '">Evaluar</button>' +
                '</div>';
        }).join(''));
    }

    function abrirEval(id, nombre, oferta) {
        $('#evalId').val(id);
        $('#evalTitulo').text('Evaluar: ' + nombre);
        $('#evalOferta').val(oferta || '');
        $('#evalNota').val('');
        $('#modalEval').addClass('visible');
    }
    function cerrarModal() { $('#modalEval').removeClass('visible'); }

    async function guardarEval() {
        var datos = {
            estado: $('#evalEstado').val(),
            ofertaAdmin: $('#evalOferta').val() || null,
            notaAdmin: $('#evalNota').val().trim()
        };
        var r = await apiEvaluarTradeIn($('#evalId').val(), datos);
        if (r.exito) { mostrarAlerta('alerta', 'success', 'Solicitud evaluada'); cerrarModal(); cargar(); }
        else mostrarAlerta('alerta', 'danger', r.mensaje);
    }

    // === Handlers delegados (antes onclick/onchange inline) ===
    $(document).on('change', '#fEstado', function() { cargar(); });
    $(document).on('click', '[data-action="abrir-eval"]', function() {
        var $b = $(this);
        // el original pasaba la oferta como número literal
        abrirEval($b.attr('data-id'), $b.attr('data-nombre'), Number($b.attr('data-oferta')));
    });
    $(document).on('click', '[data-action="cerrar-modal"]', function() { cerrarModal(); });
    $(document).on('click', '[data-action="guardar-eval"]', function() { guardarEval(); });

    $.extend(window, { cargar: cargar, abrirEval: abrirEval, cerrarModal: cerrarModal, guardarEval: guardarEval });

    cargar();
});
