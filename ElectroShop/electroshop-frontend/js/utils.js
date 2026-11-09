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
        '<a href="' + prefix + 'catalogo.html" class="navbar-brand">🔌 Electro<span>Shop</span></a>',
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
        '<a href="usuarios.html" class="navbar-brand">🔌 Electro<span>Shop</span> <small style="font-size:0.7rem;color:var(--warning);">ADMIN</small></a>',
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
        '<a href="productos.html" class="navbar-brand">🔌 Electro<span>Shop</span> <small style="font-size:0.7rem;color:var(--success);">VENDEDOR</small></a>',
        links, paginaActiva, usuario);
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
