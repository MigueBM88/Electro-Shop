// ============================================
// ElectroShop Admin - Trade-In (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAdmin()) return;
    renderNavbarAdmin('tradein');

    var esc = escaparHtml;

    var ESTADO_TI = {
        solicitado: { t: 'Solicitado', b: 'badge-warning' },
        en_revision: { t: 'En revisión', b: 'badge-primary' },
        aprobado: { t: 'Aprobado', b: 'badge-success' },
        rechazado: { t: 'Rechazado', b: 'badge-danger' },
        contraoferta: { t: 'Contraoferta', b: 'badge-warning' }
    };
    function tiBadge(e) { var m = ESTADO_TI[e] || { t: e, b: 'badge-primary' }; return '<span class="badge ' + m.b + '">' + esc(m.t) + '</span>'; }

    // Historial desplegable de la solicitud (más reciente primero)
    function historialHTML(hist) {
        if (!hist || !hist.length) return '';
        return '<details class="es-ti-historial" style="margin-top:0.5rem;font-size:0.8rem">' +
            '<summary style="cursor:pointer">Ver historial (' + hist.length + ')</summary>' +
            '<ul style="margin:0.4rem 0 0 1rem;padding:0">' +
            hist.slice().reverse().map(function(h) {
                return '<li style="margin-bottom:0.3rem">' + tiBadge(h.estado) + ' <span class="text-muted">' + formatFecha(h.fecha) + '</span>' +
                    (h.nota ? '<div>' + esc(h.nota) + '</div>' : '') + '</li>';
            }).join('') +
            '</ul></details>';
    }

    async function cargar() {
        var $cont = $('#lista');
        var params = '';
        var estado = $('#fEstado').val();
        if (estado) params = '?estado=' + estado;
        mostrarSpinner();
        try {
            var r = await apiListarTradeInAdmin(params);
            if (!r.exito) { $cont.html('<p class="text-muted">Error al cargar.</p>'); return; }
            var ss = r.datos.solicitudes;
            if (ss.length === 0) { $cont.html('<p class="text-muted">No hay solicitudes.</p>'); return; }

            $cont.html(ss.map(function(s) {
                var cliente = s.usuario ? (esc(s.usuario.nombre) + ' (' + esc(s.usuario.correo) + ')') : '—';
                var oferta = s.ofertaAdmin != null ? ' · Oferta: ' + formatPrecio(s.ofertaAdmin) : '';
                return '<div class="es-mb-3 card">' +
                    '<div class="es-fila">' +
                    '<strong>' + esc(s.nombreEquipo) + '</strong>' + tiBadge(s.estado) + '</div>' +
                    '<div class="text-muted" style="font-size:0.82rem;margin-top:0.3rem">' + esc(s.descripcion) + '</div>' +
                    '<div class="es-meta">Cliente: ' + cliente + ' · Condición: ' + esc(s.condicionDeclarada) +
                    (s.precioEstimadoCliente ? ' · Espera: ' + formatPrecio(s.precioEstimadoCliente) : '') + oferta + '</div>' +
                    (s.respuestaCliente === 'contraoferta' ? '<div class="es-meta"><strong>🔁 El cliente propone:</strong> ' + formatPrecio(s.contraofertaCliente) + '</div>' : '') +
                    ((s.respuestaCliente === 'aceptada' || s.respuestaCliente === 'rechazada') ? '<div class="es-meta"><strong>Respuesta del cliente:</strong> ' + (s.respuestaCliente === 'aceptada' ? '✅ Aceptó la contraoferta' : '❌ Rechazó la contraoferta') + '</div>' : '') +
                    (s.estado === 'contraoferta' ? '<div class="es-meta text-muted">Esperando respuesta del cliente</div>' : '') +
                    historialHTML(s.historial) +
                    (s.respuestaCliente === 'contraoferta' && s.contraofertaCliente != null ? '<button type="button" class="btn btn-sm btn-success" style="margin-top:0.5rem;margin-right:0.5rem;width:auto" data-action="aceptar-propuesta" data-id="' + esc(s._id) + '" data-nombre="' + esc(s.nombreEquipo) + '" data-monto="' + esc(s.contraofertaCliente) + '">✅ Aceptar propuesta (' + formatPrecio(s.contraofertaCliente) + ')</button>' : '') +
                    '<button class="btn btn-sm btn-primary" style="margin-top:0.5rem;width:auto" data-action="abrir-eval" data-id="' + esc(s._id) + '" data-nombre="' + esc(s.nombreEquipo) + '" data-oferta="' + esc(s.respuestaCliente === 'contraoferta' && s.contraofertaCliente != null ? s.contraofertaCliente : (s.ofertaAdmin || 0)) + '">Evaluar</button>' +
                    '</div>';
            }).join(''));
        } finally {
            ocultarSpinner();
        }
    }

    function abrirEval(id, nombre, oferta) {
        limpiarErrores();
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
        limpiarErrores();
        var hayErrores = false;
        function error(id, msg) {
            marcarCampoError(id, msg);
            if (!hayErrores) $('#' + id).trigger('focus');
            hayErrores = true;
        }
        if (datos.ofertaAdmin !== null && (isNaN(parseFloat(datos.ofertaAdmin)) || parseFloat(datos.ofertaAdmin) < 0)) error('evalOferta', 'La oferta debe ser un monto válido (0 o más)');
        if (datos.notaAdmin.length > 1000) error('evalNota', 'La nota no puede exceder 1000 caracteres');
        if (hayErrores) return;
        botonCargando('btnGuardarEval', true, 'Guardando...');
        try {
            var r = await apiEvaluarTradeIn($('#evalId').val(), datos);
            if (r.exito) { mostrarAlerta('alerta', 'success', 'Solicitud evaluada'); cerrarModal(); cargar(); }
            else mostrarErrorModal(r.mensaje);
        } finally {
            botonCargando('btnGuardarEval', false);
        }
    }

    // Aprobar directamente el monto que propuso el cliente
    async function aceptarPropuesta(id, nombre, monto, $btn) {
        if (!(await confirmarModal('¿Aprobar el Trade-In de "' + nombre + '" por ' + formatPrecio(monto) + ', el monto que propuso el cliente?', 'Aceptar propuesta', 'Sí, aprobar'))) return;
        $btn.prop('disabled', true);
        try {
            var r = await apiEvaluarTradeIn(id, { estado: 'aprobado', ofertaAdmin: monto, notaAdmin: 'Se aceptó la propuesta del cliente por ' + formatPrecio(monto) });
            if (r.exito) { mostrarAlerta('alerta', 'success', 'Propuesta aceptada: ' + nombre + ' aprobado por ' + formatPrecio(monto)); cargar(); }
            else { mostrarErrorModal((r.errores && r.errores[0]) ? r.errores[0].mensaje : r.mensaje); $btn.prop('disabled', false); }
        } catch (e) {
            mostrarErrorModal('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.', 'Error de conexión');
            $btn.prop('disabled', false);
        }
    }
    $(document).on('click', '[data-action="aceptar-propuesta"]', function() {
        var $b = $(this);
        aceptarPropuesta($b.attr('data-id'), $b.attr('data-nombre'), parseFloat($b.attr('data-monto')), $b);
    });

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
