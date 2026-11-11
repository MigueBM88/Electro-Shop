// ============================================
// ElectroShop - Navbar dinámica y utilidades
// (requiere jQuery 3.7.1 cargado ANTES de este archivo)
// ============================================

// El servidor (server.js) publica la carpeta public/ como raiz del sitio.
// Las paginas de usuario se acceden con rutas absolutas desde "/" y funcionan
// igual desde /, /admin/ o /vendedor/.
var esAdmin = window.location.pathname.includes('/admin/');
var esVendedor = window.location.pathname.includes('/vendedor/');
var prefix = '/';

// === Seguridad: escapar texto de usuario antes de insertarlo en HTML ===
// Úsalo para cualquier dato que venga del servidor/usuario cuando se arma
// markup como string (para nodos sueltos preferir .text()).
function escaparHtml(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// === Logo: chip minimalista en SVG (usa currentColor; el color lo da .logo-chip en CSS) ===
function logoChipSVG() {
    return '<svg class="logo-chip" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="14" height="14" rx="2.5"/><path d="M13 4v5M19 4v5M13 23v5M19 23v5M4 13h5M4 19h5M23 13h5M23 19h5"/></svg>';
}

// Construye la barra de navegación con jQuery (el nombre del usuario va con .text())
function construirNavbarES(brandHTML, links, paginaActiva, usuario) {
    var $nav = $('<nav>', { 'class': 'navbar' });
    var $links = $('<div>', { 'class': 'navbar-links' });
    $.each(links, function(_, l) {
        $('<a>', { href: l.href, 'class': (paginaActiva === l.id ? 'active' : '') })
            .text(l.texto)
            .appendTo($links);
    });
    var $user = $('<div>', { 'class': 'navbar-user' })
        .append($('<span>', { 'class': 'user-name' }).text(usuario.nombre))
        .append($('<button>', { type: 'button', 'class': 'btn-logout', 'data-action': 'cerrar-sesion' }).text('Salir'));

    $nav.append(brandHTML).append($links).append($user);
    $('body').prepend($nav);
}

// === Navbar USUARIO ===
function renderNavbar(paginaActiva) {
    var usuario = getUsuario();
    if (!usuario) return;

    var links = [
        { href: prefix + 'catalogo.html', texto: '🛍️ Catálogo', id: 'catalogo' },
        { href: prefix + 'buscar.html', texto: '🔍 Buscar', id: 'buscar' },
        { href: prefix + 'carrito.html', texto: '🛒 Carrito', id: 'carrito' },
        { href: prefix + 'pedidos.html', texto: '📦 Mis Pedidos', id: 'pedidos' },
        { href: prefix + 'tradein.html', texto: '♻️ Trade-In', id: 'tradein' },
        { href: prefix + 'perfil.html', texto: '👤 Perfil', id: 'perfil' }
    ];
    if (usuario.rol === 'admin') {
        links.push({ href: '/admin/usuarios.html', texto: '⚙️ Admin', id: 'admin' });
    }
    if (usuario.rol === 'vendedor') {
        links.push({ href: '/vendedor/productos.html', texto: '🏪 Mi Tienda', id: 'vendedor' });
    }

    construirNavbarES(
        '<a href="' + prefix + 'catalogo.html" class="navbar-brand">' + logoChipSVG() + ' Electro<span>Shop</span></a>',
        links, paginaActiva, usuario);
}

// === Navbar ADMIN ===
function renderNavbarAdmin(paginaActiva) {
    var usuario = getUsuario();
    if (!usuario) return;

    var links = [
        { href: 'usuarios.html', texto: '👥 Usuarios', id: 'usuarios' },
        { href: 'categorias.html', texto: '📂 Categorías', id: 'categorias' },
        { href: 'productos.html', texto: '📦 Productos', id: 'productos' },
        { href: 'pedidos.html', texto: '🧾 Pedidos', id: 'pedidos' },
        { href: 'inventario.html', texto: '📊 Inventario', id: 'inventario' },
        { href: 'resenas.html', texto: '⭐ Reseñas', id: 'resenas' },
        { href: 'reportes.html', texto: '📈 Reportes', id: 'reportes' },
        { href: 'tradein.html', texto: '♻️ Trade-In', id: 'tradein' },
        { href: '/catalogo.html', texto: '← Tienda', id: 'tienda' }
    ];

    construirNavbarES(
        '<a href="usuarios.html" class="navbar-brand">' + logoChipSVG() + ' Electro<span>Shop</span> <small style="font-size:0.7rem;color:var(--warning);">ADMIN</small></a>',
        links, paginaActiva, usuario);
}

// === Navbar VENDEDOR EXTERNO ===
function renderNavbarVendedor(paginaActiva) {
    var usuario = getUsuario();
    if (!usuario) return;

    var links = [
        { href: 'productos.html', texto: '📦 Mis Productos', id: 'productos' },
        { href: 'ventas.html', texto: '💰 Mis Ventas', id: 'ventas' },
        { href: '/catalogo.html', texto: '← Tienda', id: 'tienda' }
    ];

    construirNavbarES(
        '<a href="productos.html" class="navbar-brand">' + logoChipSVG() + ' Electro<span>Shop</span> <small style="font-size:0.7rem;color:var(--success);">VENDEDOR</small></a>',
        links, paginaActiva, usuario);
}

// === Footer publico (solo paginas de cliente; se llama desde js/public/*.js) ===
// Se arma con jQuery; los textos van con .text(). No duplica si ya existe.
function construirFooterES() {
    if ($('.footer-es').length) return;

    var $footer = $('<footer>', { 'class': 'footer-es' });
    $('<div>', { 'class': 'footer-es-brand' })
        .append(logoChipSVG(), ' Electro', $('<span>').text('Shop'))
        .appendTo($footer);
    $('<p>', { 'class': 'footer-es-texto' })
        .text('Tu tienda en línea de componentes electrónicos, nuevos y reacondicionados.')
        .appendTo($footer);
    $('<p>', { 'class': 'footer-es-copy' })
        .text('© ' + new Date().getFullYear() + ' ElectroShop. Todos los derechos reservados.')
        .appendTo($footer);

    // La clase en body activa el layout que deja el footer abajo en paginas cortas
    $('body').addClass('con-footer-es').append($footer);
}

// === Alertas ===
function mostrarAlerta(id, tipo, mensaje) {
    var $el = $('#' + id);
    if (!$el.length) return;
    $el.text(mensaje);
    $el.attr('class', 'alert alert-' + tipo + ' visible');
}

function ocultarAlerta(id) {
    var $el = $('#' + id);
    if ($el.length) $el.attr('class', 'alert');
}

// === Spinner de carga (estilo Bootstrap 5.3, sin cargar Bootstrap) ===
// El CSS (.spinner-border, .visually-hidden, .d-none, .cargando-contenedor)
// esta en css/styles.css. Markup esperado en cada pagina:
//   <div id="cargando" class="cargando-contenedor d-none">
//     <div class="spinner-border text-primary" role="status">
//       <span class="visually-hidden">Cargando...</span>
//     </div>
//   </div>

// Muestra el contenedor del spinner (quita .d-none)
function mostrarSpinner(id = 'cargando') {
    $('#' + id).removeClass('d-none');
}

// Oculta el contenedor del spinner (agrega .d-none)
function ocultarSpinner(id = 'cargando') {
    $('#' + id).addClass('d-none');
}

// Devuelve el markup Bootstrap del spinner (el texto va escapado)
function crearSpinnerHTML(texto = 'Cargando...') {
    return '<div class="spinner-border text-primary" role="status">' +
        '<span class="visually-hidden">' + escaparHtml(texto) + '</span>' +
        '</div>';
}

// Pone un boton en estado "cargando" (deshabilitado + spinner pequeno) o lo restaura.
// El HTML original se guarda en data-texto-original para devolverlo intacto.
//   botonCargando('btnGuardar', true, 'Guardando...');   // antes del request
//   botonCargando('btnGuardar', false);                  // en el finally
function botonCargando(idBoton, cargando, textoCargando) {
    var $btn = $('#' + idBoton);
    if (!$btn.length) return;

    if (cargando) {
        // Solo guardar el original la primera vez (evita guardar el spinner si se llama dos veces)
        if ($btn.attr('data-texto-original') === undefined) {
            $btn.attr('data-texto-original', $btn.html());
        }
        $btn.prop('disabled', true)
            .attr('aria-busy', 'true')
            .html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> ' +
                '<span role="status">' + escaparHtml(textoCargando || 'Cargando...') + '</span>');
    } else {
        var original = $btn.attr('data-texto-original');
        if (original !== undefined) {
            $btn.html(original).removeAttr('data-texto-original');
        }
        $btn.prop('disabled', false).removeAttr('aria-busy');
    }
}

/*
 * Version equivalente en JavaScript "vanilla" (como la mostro el profesor).
 * Solo como referencia; el proyecto usa las versiones jQuery de arriba.
 *
 *   function mostrarSpinner(id = 'cargando') {
 *       document.getElementById(id).classList.remove('d-none');
 *   }
 *
 *   function ocultarSpinner(id = 'cargando') {
 *       document.getElementById(id).classList.add('d-none');
 *   }
 *
 *   // Uso tipico:
 *   async function cargarDatos() {
 *       mostrarSpinner();
 *       try {
 *           const r = await fetch(url);
 *           // ... pintar datos ...
 *       } finally {
 *           ocultarSpinner();   // se ejecuta siempre, incluso si hay error
 *       }
 *   }
 */

// Exponer en window (igual que el resto de helpers globales)
$.extend(window, {
    mostrarSpinner: mostrarSpinner,
    ocultarSpinner: ocultarSpinner,
    crearSpinnerHTML: crearSpinnerHTML,
    botonCargando: botonCargando,
    logoChipSVG: logoChipSVG,
    construirFooterES: construirFooterES
});

// === Autenticación ===
function requiereAuth() {
    if (!estaLogueado()) { window.location.href = prefix + 'index.html'; return false; }
    return true;
}

function requiereAdmin() {
    if (!requiereAuth()) return false;
    var u = getUsuario();
    if (!u || u.rol !== 'admin') { window.location.href = prefix + 'perfil.html'; return false; }
    return true;
}

function requiereVendedor() {
    if (!requiereAuth()) return false;
    var u = getUsuario();
    if (!u || (u.rol !== 'vendedor' && u.rol !== 'admin')) { window.location.href = prefix + 'perfil.html'; return false; }
    return true;
}

// === Formato ===
function formatPrecio(num) {
    return '₡' + Number(num).toLocaleString('es-CR', { minimumFractionDigits: 0 });
}

function formatFecha(f) {
    return new Date(f).toLocaleDateString('es-CR');
}

// === Badges ===
function rolBadge(rol) {
    var c = { admin: 'badge-warning', cliente: 'badge-primary', vendedor: 'badge-success' };
    return '<span class="badge ' + (c[rol] || 'badge-primary') + '">' + escaparHtml(rol) + '</span>';
}

function estadoBadge(activo) {
    return activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>';
}

function stockBadge(stock) {
    if (stock > 10) return '<span class="badge badge-success">' + escaparHtml(stock) + ' en stock</span>';
    if (stock > 0) return '<span class="badge badge-warning">¡Solo ' + escaparHtml(stock) + '!</span>';
    return '<span class="badge badge-danger">Agotado</span>';
}

function condicionBadge(condicion) {
    var c = { nuevo: 'badge-primary', reacondicionado: 'badge-warning', poco_uso: 'badge-success' };
    var t = { nuevo: 'Nuevo', reacondicionado: 'Reacondicionado', poco_uso: 'Poco uso' };
    return '<span class="badge ' + (c[condicion] || 'badge-primary') + '">' + escaparHtml(t[condicion] || condicion) + '</span>';
}

// === Render tarjeta de producto (reutilizable) ===
// Click y hover se manejan con handlers delegados ([data-href] / [data-hover]).
function renderProductCard(p) {
    var img = (p.imagenes && p.imagenes.length > 0) ?
        '<img src="' + escaparHtml(p.imagenes[0].url) + '" style="width:100%;height:180px;object-fit:cover;">' :
        '<div style="width:100%;height:180px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:3rem;color:var(--gray-300);">📦</div>';

    var precioHTML = '<span style="font-size:1.2rem;font-weight:700;color:var(--primary);">' + formatPrecio(p.precio) + '</span>';
    if (p.precioOriginal && p.precioOriginal > p.precio) {
        precioHTML += ' <span style="font-size:0.85rem;color:var(--gray-500);text-decoration:line-through;">' + formatPrecio(p.precioOriginal) + '</span>';
    }

    return '<div class="es-product-card" style="background:var(--white);border-radius:12px;box-shadow:var(--shadow);overflow:hidden;cursor:pointer;transition:transform 0.2s" ' +
        'data-href="' + prefix + 'producto.html?id=' + encodeURIComponent(p._id) + '" ' +
        'data-hover="translateY(-4px)">' +
        img +
        '<div style="padding:1rem;">' +
        '<h3 style="font-size:1rem;margin-bottom:0.25rem;">' + escaparHtml(p.nombre) + '</h3>' +
        '<div style="font-size:0.8rem;color:var(--gray-500);margin-bottom:0.5rem;">' + escaparHtml(p.marca || '') + ' ' + condicionBadge(p.condicion) + '</div>' +
        precioHTML +
        '<div style="margin-top:0.25rem;">' + stockBadge(p.stock) + '</div>' +
        '</div></div>';
}

// ===== DataTables: helpers compartidos (requiere jQuery + DataTables) =====
// Llamar ANTES de reescribir el <tbody> para quitar la instancia anterior
function limpiarDataTable(selector) {
  if (window.jQuery && $.fn.DataTable && $.fn.DataTable.isDataTable(selector)) {
    $(selector).DataTable().destroy();
  }
}

// Llamar DESPUÉS de llenar el <tbody> para activar búsqueda, orden y paginación
function activarDataTable(selector, opciones) {
  limpiarDataTable(selector);
  return $(selector).DataTable($.extend({
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50],
    language: { url: 'https://cdn.datatables.net/plug-ins/2.1.8/i18n/es-ES.json' }
  }, opciones || {}));
}

// ===== Handlers delegados compartidos (reemplazan los onclick/onmouseover inline) =====
$(function() {
    // Botón "Salir" de cualquier navbar
    $(document).on('click', '[data-action="cerrar-sesion"]', function(e) {
        e.preventDefault();
        cerrarSesion();
    });

    // Navegación por data-href (tarjetas de producto, botones "Volver", etc.)
    $(document).on('click', '[data-href]', function(e) {
        e.preventDefault();
        window.location.href = $(this).attr('data-href');
    });

    // Efecto hover de tarjetas (antes onmouseover / onmouseout)
    $(document).on('mouseenter', '[data-hover]', function() {
        $(this).css('transform', $(this).attr('data-hover'));
    });
    $(document).on('mouseleave', '[data-hover]', function() {
        $(this).css('transform', 'none');
    });
});


// ============================================
// Manejo de errores: modal reutilizable + validación en línea
// ============================================

// Muestra un modal de error con el estilo de ElectroShop.
// mensaje puede ser un string o un arreglo de strings (se muestra como lista).
function mostrarErrorModal(mensaje, titulo) {
    $('#esErrorModal').remove();
    var $cuerpo = $('<div>', { 'class': 'es-error-body' });
    if (Array.isArray(mensaje)) {
        var $ul = $('<ul>');
        $.each(mensaje, function(_, m) { $('<li>').text(m).appendTo($ul); });
        $cuerpo.append($ul);
    } else {
        $('<p>').text(mensaje || 'Ocurrió un error inesperado.').appendTo($cuerpo);
    }
    var $overlay = $('<div>', { id: 'esErrorModal', 'class': 'es-error-overlay', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'esErrorTitulo' });
    var $caja = $('<div>', { 'class': 'es-error-modal' })
        .append($('<div>', { 'class': 'es-error-icon', 'aria-hidden': 'true' }).text('⚠️'))
        .append($('<h3>', { id: 'esErrorTitulo' }).text(titulo || 'Algo salió mal'))
        .append($cuerpo)
        .append($('<button>', { type: 'button', 'class': 'btn btn-primary es-error-cerrar' }).text('Entendido'));
    $overlay.append($caja).appendTo('body');
    $overlay.find('.es-error-cerrar').trigger('focus');
}

function cerrarErrorModal() { $('#esErrorModal').remove(); }

$(document).on('click', '.es-error-cerrar', cerrarErrorModal);
$(document).on('click', '#esErrorModal', function(e) { if (e.target === this) cerrarErrorModal(); });
$(document).on('keydown', function(e) { if (e.key === 'Escape') cerrarErrorModal(); });

// Marca un campo como inválido y muestra el mensaje debajo de él.
function marcarCampoError(idCampo, mensaje) {
    var $campo = $('#' + idCampo);
    $campo.addClass('input-error').attr('aria-invalid', 'true');
    var idMsg = idCampo + 'Error';
    $('#' + idMsg).remove();
    $('<small>', { id: idMsg, 'class': 'campo-error-msg' }).text(mensaje).insertAfter($campo);
    $campo.attr('aria-describedby', idMsg);
}

// Limpia los errores de un campo, o de todos dentro de un contenedor.
function limpiarErrores(selectorContenedor) {
    var $c = $(selectorContenedor || document);
    $c.find('.input-error').removeClass('input-error').removeAttr('aria-invalid aria-describedby');
    $c.find('.campo-error-msg').remove();
}

// Al escribir o cambiar un campo con error, se quita su error.
$(document).on('input change', '.input-error', function() {
    $(this).removeClass('input-error').removeAttr('aria-invalid aria-describedby');
    $('#' + this.id + 'Error').remove();
});


// Modal de confirmación (reemplaza confirm()). Devuelve una Promise<boolean>.
// Uso: if (!(await confirmarModal('¿Eliminar?'))) return;
function confirmarModal(mensaje, titulo, textoAceptar) {
    return new Promise(function(resolve) {
        $('#esConfirmModal').remove();
        var $overlay = $('<div>', { id: 'esConfirmModal', 'class': 'es-error-overlay', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'esConfirmTitulo' });
        var $caja = $('<div>', { 'class': 'es-error-modal es-confirm-modal' })
            .append($('<div>', { 'class': 'es-error-icon', 'aria-hidden': 'true' }).text('❓'))
            .append($('<h3>', { id: 'esConfirmTitulo' }).text(titulo || 'Confirmar acción'))
            .append($('<div>', { 'class': 'es-error-body' }).append($('<p>').text(mensaje)))
            .append($('<div>', { 'class': 'es-confirm-botones' })
                .append($('<button>', { type: 'button', 'class': 'btn btn-secondary es-confirm-no' }).text('Cancelar'))
                .append($('<button>', { type: 'button', 'class': 'btn btn-danger es-confirm-si' }).text(textoAceptar || 'Aceptar')));
        function cerrar(valor) {
            $(document).off('keydown.esConfirm');
            $overlay.remove();
            resolve(valor);
        }
        $caja.on('click', '.es-confirm-si', function() { cerrar(true); });
        $caja.on('click', '.es-confirm-no', function() { cerrar(false); });
        $overlay.on('click', function(e) { if (e.target === this) cerrar(false); });
        $(document).on('keydown.esConfirm', function(e) { if (e.key === 'Escape') cerrar(false); });
        $overlay.append($caja).appendTo('body');
        $caja.find('.es-confirm-no').trigger('focus');
    });
}
