// ============================================
// ElectroShop - Trade-In (cliente) (migrado a jQuery)
// ============================================
$(function() {
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
        var r = await apiMisTradeIn();
        if (!r.exito) { $cont.html('<p class="text-muted">No se pudo cargar.</p>'); return; }
        var ss = r.datos.solicitudes;
        if (ss.length === 0) { $cont.html('<p class="text-muted">Aún no tienes solicitudes.</p>'); return; }

        $cont.html(ss.map(function(s) {
            var oferta = s.ofertaAdmin != null ? '<div style="margin-top:0.4rem"><strong>Oferta de ElectroShop:</strong> ' + formatPrecio(s.ofertaAdmin) + '</div>' : '';
            var nota = s.notaAdmin ? '<div class="text-muted" style="font-size:0.8rem;margin-top:0.3rem">Nota: ' + esc(s.notaAdmin) + '</div>' : '';
            return '<div class="card" style="margin-bottom:0.75rem">' +
                '<div style="display:flex;justify-content:space-between;align-items:center">' +
                '<strong>' + esc(s.nombreEquipo) + '</strong>' + tiBadge(s.estado) + '</div>' +
                '<div class="text-muted" style="font-size:0.82rem;margin-top:0.3rem">' + esc(s.descripcion) + '</div>' +
                '<div style="font-size:0.8rem;margin-top:0.3rem">Condición: ' + esc(s.condicionDeclarada) + (s.precioEstimadoCliente ? ' · Esperabas: ' + formatPrecio(s.precioEstimadoCliente) : '') + '</div>' +
                oferta + nota +
                '<div class="text-muted" style="font-size:0.72rem;margin-top:0.3rem">' + formatFecha(s.createdAt) + '</div>' +
                '</div>';
        }).join(''));
    }

    async function enviar() {
        var datos = {
            nombreEquipo: $('#nombreEquipo').val().trim(),
            descripcion: $('#descripcion').val().trim(),
            condicionDeclarada: $('#condicion').val(),
            precioEstimadoCliente: $('#precioEstimado').val() || null
        };
        if (!datos.nombreEquipo || !datos.descripcion) {
            mostrarAlerta('alerta', 'danger', 'Completa el equipo y la descripción');
            return;
        }
        var r = await apiCrearTradeIn(datos);
        if (r.exito) {
            mostrarAlerta('alerta', 'success', 'Solicitud enviada. Te avisaremos cuando la evaluemos.');
            $('#nombreEquipo').val('');
            $('#descripcion').val('');
            $('#precioEstimado').val('');
            cargar();
        } else {
            mostrarAlerta('alerta', 'danger', r.mensaje);
        }
    }

    // === Handler delegado (antes onclick inline) ===
    $(document).on('click', '[data-action="enviar-tradein"]', function() { enviar(); });

    $.extend(window, { cargar: cargar, enviar: enviar });

    cargar();
});
