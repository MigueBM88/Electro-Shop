// ============================================
// ElectroShop - Detalle de producto (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAuth()) return;
    renderNavbar('catalogo');

    var esc = escaparHtml;

    // Obtener ID del producto de la URL
    var params = new URLSearchParams(window.location.search);
    var productoId = params.get('id');

    if (!productoId) {
        window.location.href = 'catalogo.html';
    }

    async function cargarProducto() {
        try {
            var r = await apiProductoDetalle(productoId);

            if (!r.exito) {
                $('#contenido').html('<p class="text-muted text-center">Producto no encontrado</p>');
                return;
            }

            var p = r.datos.producto;
            document.title = 'ElectroShop - ' + p.nombre;

            // Imagen
            var imgHTML = (p.imagenes && p.imagenes.length > 0) ?
                '<img src="' + esc(p.imagenes[0].url) + '" style="width:100%;border-radius:12px;max-height:400px;object-fit:cover;">' :
                '<div style="width:100%;height:300px;background:var(--gray-100);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:5rem;color:var(--gray-300);">📦</div>';

            // Precio
            var precioHTML = '<span style="font-size:1.8rem;font-weight:700;color:var(--primary);">' + formatPrecio(p.precio) + '</span>';
            if (p.precioOriginal && p.precioOriginal > p.precio) {
                var descuento = Math.round((1 - p.precio / p.precioOriginal) * 100);
                precioHTML += ' <span style="font-size:1rem;color:var(--gray-500);text-decoration:line-through;">' + formatPrecio(p.precioOriginal) + '</span>';
                precioHTML += ' <span class="badge badge-success">-' + descuento + '%</span>';
            }

            // Stock + agregar al carrito
            var stockHTML = '';
            if (p.stock <= 0) {
                stockHTML = '<div class="alert alert-warning visible" style="margin-top:1rem;">⚠️ Este producto está agotado actualmente. No se puede agregar al carrito.</div>';
            } else {
                stockHTML = '<div style="margin-top:1rem;">' + stockBadge(p.stock) + '</div>' +
                    '<div style="display:flex;gap:0.5rem;align-items:center;margin-top:1rem;">' +
                    '<input type="number" id="cantidadAgregar" value="1" min="1" max="' + esc(p.stock) + '" style="width:80px">' +
                    '<button class="btn btn-primary" style="width:auto" data-action="agregar-carrito">🛒 Agregar al carrito</button>' +
                    '</div>';
            }

            // Especificaciones
            var specsHTML = '';
            if (p.especificaciones && p.especificaciones.length > 0) {
                specsHTML = '<h3 style="margin:1.5rem 0 0.75rem;">📋 Especificaciones Técnicas</h3>' +
                    '<table style="width:100%;">' +
                    p.especificaciones.map(function(s) {
                        return '<tr><td style="padding:0.5rem 0;border-bottom:1px solid var(--gray-100);font-weight:600;color:var(--gray-500);width:40%;font-size:0.85rem;">' + esc(s.nombre) + '</td>' +
                            '<td style="padding:0.5rem 0;border-bottom:1px solid var(--gray-100);">' + esc(s.valor) + '</td></tr>';
                    }).join('') +
                    '</table>';
            }

            // Datasheet
            var datasheetHTML = '';
            if (p.datasheetUrl && /^https?:\/\//i.test(String(p.datasheetUrl).trim())) {
                datasheetHTML = '<div style="margin-top:1rem;"><a href="' + esc(p.datasheetUrl) + '" target="_blank" class="btn btn-outline btn-sm" style="width:auto;">📄 Descargar Datasheet (PDF)</a></div>';
            }

            // Categoría y condición
            var catNombre = (p.categoria && p.categoria.nombre) ? p.categoria.nombre : 'Sin categoría';
            var catIcono = (p.categoria && p.categoria.icono) ? p.categoria.icono : '📦';

            // Construir HTML completo (los datos del producto van escapados)
            $('#contenido').html(
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">' +
                '<div>' + imgHTML + '</div>' +
                '<div>' +
                '<div style="font-size:0.85rem;color:var(--gray-500);margin-bottom:0.5rem;">' + esc(catIcono) + ' ' + esc(catNombre) + '</div>' +
                '<h2 style="font-size:1.5rem;margin-bottom:0.5rem;">' + esc(p.nombre) + '</h2>' +
                '<div style="margin-bottom:0.75rem;">' + condicionBadge(p.condicion) + ' <span style="color:var(--gray-500);font-size:0.85rem;">Marca: <strong>' + esc(p.marca || 'Genérico') + '</strong></span></div>' +
                precioHTML +
                stockHTML +
                '<p style="margin-top:1rem;color:var(--gray-700);line-height:1.7;">' + esc(p.descripcion) + '</p>' +
                datasheetHTML +
                (p.sku ? '<div style="margin-top:1rem;font-size:0.8rem;color:var(--gray-500);">SKU: ' + esc(p.sku) + '</div>' : '') +
                '</div>' +
                '</div>' +
                specsHTML);

            // Productos relacionados
            if (r.datos.relacionados && r.datos.relacionados.length > 0) {
                $('#zonaRelacionados').removeClass('hidden');
                $('#gridRelacionados').html(r.datos.relacionados.map(function(p) {
                    return renderProductCard(p);
                }).join(''));
            }

        } catch (e) {
            mostrarAlerta('alerta', 'error', 'Error al cargar el producto');
        }
    }

    async function agregarAlCarrito() {
        var cant = parseInt($('#cantidadAgregar').val()) || 1;
        try {
            var r = await apiAgregarAlCarrito(productoId, cant);
            if (r.exito) {
                mostrarAlerta('alerta', 'success', '✅ Producto agregado al carrito. ');
                $('#alerta').append($('<a>', { href: 'carrito.html' }).text('Ver carrito'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                mostrarAlerta('alerta', 'danger', r.mensaje || 'No se pudo agregar al carrito');
            }
        } catch (e) {
            mostrarAlerta('alerta', 'danger', 'Error de conexión con el servidor');
        }
    }

    // ===== RESEÑAS =====
    function estrellasHTML(n) {
        var s = '';
        for (var i = 1; i <= 5; i++) s += (i <= n ? '★' : '☆');
        return '<span style="color:#f5a623">' + s + '</span>';
    }

    async function cargarResenas() {
        var $cont = $('#contenidoResenas');
        try {
            var r = await apiResenasProducto(productoId);
            if (!r.exito) { $cont.html('<p class="text-muted">No se pudieron cargar las reseñas.</p>'); return; }

            var resumen = r.datos.resumen;
            var resenas = r.datos.resenas;

            var cabecera = '<div class="card" style="margin-bottom:1rem">' +
                '<div style="font-size:1.5rem;font-weight:700">' + (resumen.total ? resumen.promedio.toFixed(1) : '—') + ' ' + estrellasHTML(Math.round(resumen.promedio)) + '</div>' +
                '<div class="text-muted" style="font-size:0.85rem">' + esc(resumen.total) + ' reseña(s)</div>' +
                '</div>';

            // Formulario para dejar reseña
            var form = '<div class="card" style="margin-bottom:1rem">' +
                '<h4 style="margin-bottom:0.5rem">Deja tu reseña</h4>' +
                '<div class="form-group"><label>Calificación</label>' +
                '<select id="miCalificacion"><option value="5">★★★★★ (5)</option><option value="4">★★★★ (4)</option><option value="3">★★★ (3)</option><option value="2">★★ (2)</option><option value="1">★ (1)</option></select></div>' +
                '<div class="form-group"><label>Comentario (opcional)</label><textarea id="miComentario" rows="3" placeholder="¿Qué te pareció el producto?"></textarea></div>' +
                '<button class="btn btn-primary btn-sm" style="width:auto" data-action="enviar-resena">Publicar reseña</button>' +
                '</div>';

            var lista = resenas.length === 0
                ? '<p class="text-muted">Todavía no hay reseñas. ¡Sé el primero!</p>'
                : resenas.map(function(re) {
                    var verif = re.compraVerificada ? ' <span class="badge badge-success" style="font-size:0.6rem">Compra verificada</span>' : '';
                    return '<div class="card" style="margin-bottom:0.75rem">' +
                        '<div style="display:flex;justify-content:space-between;align-items:center">' +
                        '<strong>' + esc(re.nombreUsuario || 'Usuario') + '</strong>' + estrellasHTML(re.calificacion) + '</div>' +
                        verif +
                        (re.comentario ? '<p style="margin-top:0.4rem;font-size:0.9rem">' + esc(re.comentario) + '</p>' : '') +
                        '<div class="text-muted" style="font-size:0.72rem;margin-top:0.3rem">' + formatFecha(re.createdAt) + '</div>' +
                        '</div>';
                }).join('');

            $cont.html(cabecera + form + lista);
        } catch (e) {
            $cont.html('<p class="text-muted">Error de conexión al cargar reseñas.</p>');
        }
    }

    async function enviarResena() {
        var datos = {
            productoId: productoId,
            calificacion: parseInt($('#miCalificacion').val()),
            comentario: $('#miComentario').val().trim()
        };
        var r = await apiCrearResena(datos);
        if (r.exito) { mostrarAlerta('alerta', 'success', '¡Gracias por tu reseña!'); cargarResenas(); }
        else mostrarAlerta('alerta', 'danger', r.mensaje || 'No se pudo publicar la reseña');
    }

    // === Handlers delegados (antes onclick inline) ===
    $(document).on('click', '[data-action="volver"]', function() { history.back(); });
    $(document).on('click', '[data-action="agregar-carrito"]', function() { agregarAlCarrito(); });
    $(document).on('click', '[data-action="enviar-resena"]', function() { enviarResena(); });

    $.extend(window, {
        cargarProducto: cargarProducto,
        agregarAlCarrito: agregarAlCarrito,
        cargarResenas: cargarResenas,
        enviarResena: enviarResena
    });

    cargarProducto();
    cargarResenas();
});
