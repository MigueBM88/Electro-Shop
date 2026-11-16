// ============================================
// ElectroShop - Trade-In (cliente) (migrado a jQuery)
// ============================================
$(function() {
    construirFooterES();
    if (!requiereAuth()) return;
    renderNavbar('tradein');

    var esc = escaparHtml;

    var ESTADO_TI = {
        solicitado: { t: 'Solicitado', b: 'badge-warning' },
        en_revision: { t: 'En revisión', b: 'badge-primary' },
        aprobado: { t: 'Aprobado', b: 'badge-success' },
        rechazado: { t: 'Rechazado', b: 'badge-danger' },
        contraoferta: { t: 'Contraoferta', b: 'badge-warning' }
    };
    function tiBadge(e) { var m = ESTADO_TI[e] || { t: e, b: 'badge-primary' }; return '<span class="badge ' + m.b + '">' + esc(m.t) + '</span>'; }

    async function cargar() {
        var $cont = $('#listaSolicitudes');
        mostrarSpinner();
        try {
            var r = await apiMisTradeIn();
            if (!r.exito) { $cont.html('<p class="text-muted">No se pudo cargar.</p>'); return; }
            var ss = r.datos.solicitudes;
            if (ss.length === 0) { $cont.html('<p class="text-muted">Aún no tienes solicitudes.</p>'); return; }

            $cont.html(ss.map(function(s) {
                var oferta = s.ofertaAdmin != null ? '<div style="margin-top:0.4rem"><strong>Oferta de ElectroShop:</strong> ' + formatPrecio(s.ofertaAdmin) + '</div>' : '';
                var acciones = '';
                if (s.estado === 'contraoferta') {
                    acciones = '<div class="es-ti-acciones" style="display:flex;gap:0.5rem;margin-top:0.6rem;flex-wrap:wrap">' +
                        '<button type="button" class="btn btn-success btn-sm" data-action="responder-tradein" data-id="' + esc(s._id) + '" data-aceptar="true">✅ Aceptar oferta</button>' +
                        '<button type="button" class="btn btn-danger btn-sm" data-action="responder-tradein" data-id="' + esc(s._id) + '" data-aceptar="false">Rechazar</button>' +
                        '</div>' +
                        '<div class="es-ti-acciones" style="display:flex;gap:0.5rem;margin-top:0.5rem;align-items:center;flex-wrap:wrap">' +
                        '<label class="es-txt-sm" for="monto-' + esc(s._id) + '">¿Otro monto?</label>' +
                        '<input type="number" min="0" step="1" id="monto-' + esc(s._id) + '" placeholder="₡ tu propuesta" style="max-width:160px">' +
                        '<button type="button" class="btn btn-secondary btn-sm" data-action="proponer-tradein" data-id="' + esc(s._id) + '">Proponer</button>' +
                        '</div>';
                } else if (s.respuestaCliente === 'contraoferta') {
                    acciones = '<div class="es-meta text-muted">Propusiste ' + formatPrecio(s.contraofertaCliente) + '. Estamos revisando tu propuesta.</div>';
                } else if (s.respuestaCliente) {
                    acciones = '<div class="es-meta text-muted">Tu respuesta: ' + (s.respuestaCliente === 'aceptada' ? 'aceptaste la contraoferta' : 'rechazaste la contraoferta') + '</div>';
                }
                var historial = '';
                if (s.historial && s.historial.length) {
                    historial = '<details class="es-ti-historial" style="margin-top:0.5rem;font-size:0.8rem">' +
                        '<summary style="cursor:pointer">Ver historial (' + s.historial.length + ')</summary>' +
                        '<ul style="margin:0.4rem 0 0 1rem;padding:0">' +
                        s.historial.slice().reverse().map(function(h) {
                            return '<li style="margin-bottom:0.3rem">' + tiBadge(h.estado) + ' <span class="text-muted">' + formatFecha(h.fecha) + '</span>' +
                                (h.nota ? '<div>' + esc(h.nota) + '</div>' : '') + '</li>';
                        }).join('') +
                        '</ul></details>';
                }
                var nota = s.notaAdmin ? '<div class="es-meta text-muted">Nota: ' + esc(s.notaAdmin) + '</div>' : '';
                return '<div class="card es-tradein-item es-ti-' + esc(s.estado) + '">' +
                    '<div class="es-fila">' +
                    '<strong>' + esc(s.nombreEquipo) + '</strong>' + tiBadge(s.estado) + '</div>' +
                    '<div class="text-muted" style="font-size:0.82rem;margin-top:0.3rem">' + esc(s.descripcion) + '</div>' +
                    '<div class="es-meta">Condición: ' + esc(s.condicionDeclarada) + (s.precioEstimadoCliente ? ' · Esperabas: ' + formatPrecio(s.precioEstimadoCliente) : '') + '</div>' +
                    oferta + nota + acciones + historial +
                    '<div class="text-muted" style="font-size:0.72rem;margin-top:0.3rem">' + formatFecha(s.createdAt) + '</div>' +
                    '</div>';
            }).join(''));
        } finally {
            ocultarSpinner();
        }
    }

    async function enviar() {
        var datos = {
            nombreEquipo: $('#nombreEquipo').val().trim(),
            descripcion: $('#descripcion').val().trim(),
            condicionDeclarada: $('#condicion').val(),
            precioEstimadoCliente: $('#precioEstimado').val() || null
        };
        limpiarErrores();
        var hayErrores = false;
        function error(id, msg) {
            marcarCampoError(id, msg);
            if (!hayErrores) $('#' + id).trigger('focus');
            hayErrores = true;
        }
        if (!datos.nombreEquipo) error('nombreEquipo', 'El nombre del equipo es obligatorio');
        else if (datos.nombreEquipo.length > 150) error('nombreEquipo', 'El nombre del equipo no puede exceder 150 caracteres');
        if (!datos.descripcion) error('descripcion', 'La descripción es obligatoria');
        else if (datos.descripcion.length > 2000) error('descripcion', 'La descripción no puede exceder 2000 caracteres');
        if (datos.precioEstimadoCliente !== null && parseFloat(datos.precioEstimadoCliente) < 0) error('precioEstimado', 'El precio no puede ser negativo');
        if (hayErrores) return;
        botonCargando('btnEnviarTradein', true, 'Enviando...');
        try {
            var r = await apiCrearTradeIn(datos);
            if (r.exito) {
                mostrarInfoModal('Recibimos tu solicitud de Trade-In. Te avisaremos cuando la evaluemos.', 'Solicitud enviada', 'success');
                $('#nombreEquipo').val('');
                $('#descripcion').val('');
                $('#precioEstimado').val('');
                cargar();
            } else {
                mostrarErrorModal(r.mensaje);
            }
        } finally {
            botonCargando('btnEnviarTradein', false);
        }
    }

    async function responder(id, aceptar, $btn) {
        var msg = aceptar
            ? '¿Aceptas la contraoferta de ElectroShop? La solicitud quedará aprobada.'
            : '¿Rechazas la contraoferta? La solicitud quedará rechazada.';
        if (!(await confirmarModal(msg, aceptar ? 'Aceptar contraoferta' : 'Rechazar contraoferta', aceptar ? 'Sí, aceptar' : 'Sí, rechazar'))) return;
        $btn.closest('.es-ti-acciones').find('button').prop('disabled', true);
        try {
            var r = await apiResponderTradeIn(id, aceptar);
            if (r.exito) {
                mostrarInfoModal(aceptar ? 'Aceptaste la contraoferta. Te contactaremos para coordinar la entrega del equipo.' : 'Rechazaste la contraoferta.', r.mensaje, aceptar ? 'success' : 'info');
                cargar();
            } else {
                mostrarErrorModal(r.mensaje);
                $btn.closest('.es-ti-acciones').find('button').prop('disabled', false);
            }
        } catch (e) {
            mostrarErrorModal('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.', 'Error de conexión');
            $btn.closest('.es-ti-acciones').find('button').prop('disabled', false);
        }
    }

    async function proponer(id, $btn) {
        var idInput = 'monto-' + id;
        var valor = $('#' + idInput).val();
        limpiarErrores($btn.closest('.es-tradein-item'));
        if (valor === '' || isNaN(parseFloat(valor)) || parseFloat(valor) < 0) {
            marcarCampoError(idInput, 'Ingresa un monto válido (0 o más)');
            $('#' + idInput).trigger('focus');
            return;
        }
        var monto = parseFloat(valor);
        if (!(await confirmarModal('¿Enviar tu propuesta de ' + formatPrecio(monto) + '? ElectroShop la revisará de nuevo.', 'Proponer otro monto', 'Sí, enviar'))) return;
        var $btns = $btn.closest('.es-tradein-item').find('.es-ti-acciones button');
        $btns.prop('disabled', true);
        try {
            var r = await apiProponerMontoTradeIn(id, monto);
            if (r.exito) {
                mostrarInfoModal('Enviamos tu propuesta de ' + formatPrecio(monto) + '. Te avisaremos cuando la revisemos.', 'Propuesta enviada', 'success');
                cargar();
            } else {
                mostrarErrorModal((r.errores && r.errores[0]) ? r.errores[0].mensaje : r.mensaje);
                $btns.prop('disabled', false);
            }
        } catch (e) {
            mostrarErrorModal('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.', 'Error de conexión');
            $btns.prop('disabled', false);
        }
    }
    $(document).on('click', '[data-action="proponer-tradein"]', function() { proponer($(this).attr('data-id'), $(this)); });

    // === Handler delegado (antes onclick inline) ===
    $(document).on('click', '[data-action="responder-tradein"]', function() {
        var $b = $(this);
        responder($b.attr('data-id'), $b.attr('data-aceptar') === 'true', $b);
    });
    $(document).on('click', '[data-action="enviar-tradein"]', function() { enviar(); });

    $.extend(window, { cargar: cargar, enviar: enviar });

    cargar();
});
