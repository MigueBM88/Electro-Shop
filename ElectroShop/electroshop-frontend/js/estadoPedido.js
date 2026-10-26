// ============================================
// ElectroShop - Helpers de estado de pedido (compartido)
// ============================================

var ESTADOS_PEDIDO = ['pendiente', 'pagado', 'preparando', 'enviado', 'entregado'];

var ESTADO_META = {
    pendiente:  { texto: 'Pendiente de pago', badge: 'badge-warning', icono: '⏳' },
    pagado:     { texto: 'Pagado',            badge: 'badge-primary', icono: '💳' },
    preparando: { texto: 'En preparación',    badge: 'badge-primary', icono: '📦' },
    enviado:    { texto: 'Enviado',           badge: 'badge-primary', icono: '🚚' },
    entregado:  { texto: 'Entregado',         badge: 'badge-success', icono: '✅' },
    cancelado:  { texto: 'Cancelado',         badge: 'badge-danger',  icono: '❌' }
};

function estadoPedidoBadge(estado) {
    var m = ESTADO_META[estado] || { texto: estado, badge: 'badge-primary', icono: '' };
    return '<span class="badge ' + m.badge + '">' + m.icono + ' ' + m.texto + '</span>';
}

// Devuelve HTML de una línea de tiempo visual del progreso del pedido
function timelinePedido(estadoActual) {
    if (estadoActual === 'cancelado') {
        return '<div class="alert alert-danger visible">❌ Este pedido fue cancelado.</div>';
    }
    var idxActual = ESTADOS_PEDIDO.indexOf(estadoActual);
    var pasos = ESTADOS_PEDIDO.map(function(e, idx) {
        var m = ESTADO_META[e];
        var activo = idx <= idxActual;
        var color = activo ? 'var(--primary)' : 'var(--gray-300)';
        var peso = idx === idxActual ? '700' : '400';
        return '<div style="flex:1;text-align:center;position:relative">' +
            '<div style="width:34px;height:34px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;' +
            'background:' + (activo ? 'var(--primary)' : 'var(--gray-100)') + ';color:' + (activo ? '#fff' : 'var(--gray-300)') + '">' + m.icono + '</div>' +
            '<div style="font-size:0.72rem;margin-top:0.25rem;color:' + color + ';font-weight:' + peso + '">' + m.texto + '</div>' +
            '</div>';
    }).join('');
    return '<div style="display:flex;align-items:flex-start;gap:0.25rem;margin:1rem 0">' + pasos + '</div>';
}
