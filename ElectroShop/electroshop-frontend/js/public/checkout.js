// ============================================
// ElectroShop - Checkout (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAuth()) return;
    renderNavbar('carrito');

    var esc = escaparHtml;
    var carritoActual = null;
    var perfil = null;

    async function init() {
        var $cont = $('#contenido');
        try {
            var rc = await apiObtenerCarrito();
            if (!rc.exito || rc.datos.items.length === 0) {
                $cont.html('<p class="text-muted">Tu carrito está vacío. <a href="catalogo.html">Ir al catálogo</a></p>');
                return;
            }
            carritoActual = rc.datos;

            // Traer dirección del perfil (si existe)
            var rp = await apiObtenerPerfil();
            perfil = (rp.exito && rp.datos.usuario) ? rp.datos.usuario : {};
            var dir = perfil.direccion || {};

            var res = carritoActual.resumen;
            var envioTxt = res.envio === 0 ? 'GRATIS' : formatPrecio(res.envio);

            var itemsHTML = carritoActual.items.map(function(i) {
                return '<div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.3rem">' +
                    '<span>' + esc(i.cantidad) + '× ' + esc(i.nombre) + '</span><span>' + formatPrecio(i.subtotal) + '</span></div>';
            }).join('');

            $cont.html(
                // Columna izquierda: formulario
                '<div>' +
                  '<div class="card">' +
                    '<h3 style="margin-bottom:0.75rem">📍 Dirección de envío</h3>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1rem">' +
                      campo('Provincia', 'dProvincia', dir.provincia) +
                      campo('Cantón', 'dCanton', dir.canton) +
                      campo('Distrito', 'dDistrito', dir.distrito) +
                      campo('Detalle', 'dDetalle', dir.detalle) +
                    '</div>' +
                  '</div>' +

                  '<div class="card" style="margin-top:1rem">' +
                    '<h3 style="margin-bottom:0.75rem">💳 Método de pago</h3>' +
                    '<div class="form-group">' +
                      '<select id="metodoPago">' +
                        '<option value="tarjeta">Tarjeta de crédito/débito</option>' +
                        '<option value="sinpe">SINPE Móvil</option>' +
                        '<option value="contra_entrega">Pago contra entrega</option>' +
                      '</select>' +
                    '</div>' +
                    '<div id="bloqueTarjeta">' +
                      '<div class="form-group"><label>Número de tarjeta</label>' +
                      '<input type="text" id="numTarjeta" placeholder="4111 1111 1111 1111" maxlength="19"></div>' +
                      '<p class="text-muted" style="font-size:0.72rem">Pago simulado. Usa cualquier número. (Tip de prueba: una tarjeta terminada en 0000 será rechazada.)</p>' +
                    '</div>' +
                  '</div>' +
                '</div>' +

                // Columna derecha: resumen
                '<div class="card">' +
                  '<h3 style="margin-bottom:0.75rem">Tu pedido</h3>' +
                  itemsHTML +
                  '<hr style="margin:0.5rem 0">' +
                  fila('Subtotal', formatPrecio(res.subtotal)) +
                  fila('IVA (13%)', formatPrecio(res.impuesto)) +
                  fila('Envío', envioTxt) +
                  '<hr style="margin:0.5rem 0">' +
                  '<div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;margin-bottom:0.75rem"><span>Total</span><span style="color:var(--primary)">' + formatPrecio(res.total) + '</span></div>' +
                  '<button id="btnPagar" class="btn btn-primary" data-action="pagar">Confirmar y pagar</button>' +
                '</div>');
        } catch (e) {
            $cont.html('<p class="text-muted">Error de conexión con el servidor.</p>');
        }
    }

    function campo(label, id, valor) {
        return '<div class="form-group"><label>' + label + '</label><input type="text" id="' + id + '" value="' + esc(valor || '') + '"></div>';
    }
    function fila(label, valor) {
        return '<div style="display:flex;justify-content:space-between;margin-bottom:0.4rem"><span>' + label + '</span><span>' + valor + '</span></div>';
    }
    function toggleTarjeta() {
        var m = $('#metodoPago').val();
        $('#bloqueTarjeta').css('display', (m === 'tarjeta') ? 'block' : 'none');
    }

    async function pagar() {
        var $btn = $('#btnPagar');
        $btn.prop('disabled', true).text('Procesando...');

        var datos = {
            metodoPago: $('#metodoPago').val(),
            datosPago: { numeroTarjeta: $('#numTarjeta').val() || '' },
            direccionEnvio: {
                provincia: val('dProvincia'), canton: val('dCanton'),
                distrito: val('dDistrito'), detalle: val('dDetalle')
            }
        };

        try {
            var r = await apiCheckout(datos);
            if (r.exito) {
                window.location.href = 'pedido.html?id=' + r.datos.pedido._id + '&nuevo=1';
            } else {
                mostrarAlerta('alerta', 'danger', r.mensaje || 'No se pudo procesar el pago');
                $btn.prop('disabled', false).text('Confirmar y pagar');
            }
        } catch (e) {
            mostrarAlerta('alerta', 'danger', 'Error de conexión con el servidor');
            $btn.prop('disabled', false).text('Confirmar y pagar');
        }
    }
    function val(id) { var $el = $('#' + id); return $el.length ? $el.val().trim() : ''; }

    // === Handlers delegados (antes onchange/onclick inline) ===
    $(document).on('change', '#metodoPago', function() { toggleTarjeta(); });
    $(document).on('click', '[data-action="pagar"]', function() { pagar(); });

    $.extend(window, { init: init, toggleTarjeta: toggleTarjeta, pagar: pagar });

    init();
});
