// ============================================
// ElectroShop - Utilidades compartidas de Trade-In (cliente y admin)
// Requiere utils.js (escaparHtml, formatFecha) cargado antes.
// ============================================
var ESTADO_TI = {
    solicitado: { t: 'Solicitado', b: 'badge-warning' },
    en_revision: { t: 'En revisión', b: 'badge-primary' },
    aprobado: { t: 'Aprobado', b: 'badge-success' },
    rechazado: { t: 'Rechazado', b: 'badge-danger' },
    contraoferta: { t: 'Contraoferta', b: 'badge-warning' }
};

function tiBadge(e) {
    var m = ESTADO_TI[e] || { t: e, b: 'badge-primary' };
    return '<span class="badge ' + m.b + '">' + escaparHtml(m.t) + '</span>';
}

// Historial desplegable (más reciente primero)
function tiHistorialHTML(hist) {
    if (!hist || !hist.length) return '';
    return '<details class="es-ti-historial">' +
        '<summary>Ver historial (' + hist.length + ')</summary>' +
        '<ul>' +
        hist.slice().reverse().map(function(h) {
            return '<li>' + tiBadge(h.estado) + ' <span class="text-muted">' + formatFecha(h.fecha) + '</span>' +
                (h.nota ? '<div>' + escaparHtml(h.nota) + '</div>' : '') + '</li>';
        }).join('') +
        '</ul></details>';
}
