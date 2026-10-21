// ============================================
// ElectroShop - Navbar dinámica y utilidades
// ============================================

var esAdmin = window.location.pathname.includes('/admin/');
var prefix = esAdmin ? '../' : '';

// === Navbar USUARIO ===
function renderNavbar(paginaActiva) {
    var usuario = getUsuario();
    if (!usuario) return;

    var links = [
        { href: prefix + 'catalogo.html', texto: '🛍️ Catálogo', id: 'catalogo' },
        { href: prefix + 'buscar.html', texto: '🔍 Buscar', id: 'buscar' },
        { href: prefix + 'perfil.html', texto: '👤 Perfil', id: 'perfil' }
    ];
    if (usuario.rol === 'admin') {
        links.push({ href: prefix + 'admin/usuarios.html', texto: '⚙️ Admin', id: 'admin' });
    }

    var linksHTML = links.map(function(l) {
        return '<a href="' + l.href + '" class="' + (paginaActiva === l.id ? 'active' : '') + '">' + l.texto + '</a>';
    }).join('');

    var nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.innerHTML =
        '<a href="' + prefix + 'catalogo.html" class="navbar-brand">🔌 Electro<span>Shop</span></a>' +
        '<div class="navbar-links">' + linksHTML + '</div>' +
        '<div class="navbar-user">' +
        '<span class="user-name">' + usuario.nombre + '</span>' +
        '<button class="btn-logout" onclick="cerrarSesion()">Salir</button>' +
        '</div>';
    document.body.prepend(nav);
}

// === Navbar ADMIN ===
function renderNavbarAdmin(paginaActiva) {
    var usuario = getUsuario();
    if (!usuario) return;

    var links = [
        { href: 'usuarios.html', texto: '👥 Usuarios', id: 'usuarios' },
        { href: 'categorias.html', texto: '📂 Categorías', id: 'categorias' },
        { href: 'productos.html', texto: '📦 Productos', id: 'productos' },
        { href: '../catalogo.html', texto: '← Tienda', id: 'tienda' }
    ];

    var linksHTML = links.map(function(l) {
        return '<a href="' + l.href + '" class="' + (paginaActiva === l.id ? 'active' : '') + '">' + l.texto + '</a>';
    }).join('');

    var nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.innerHTML =
        '<a href="usuarios.html" class="navbar-brand">🔌 Electro<span>Shop</span> <small style="font-size:0.7rem;color:var(--warning);">ADMIN</small></a>' +
        '<div class="navbar-links">' + linksHTML + '</div>' +
        '<div class="navbar-user">' +
        '<span class="user-name">' + usuario.nombre + '</span>' +
        '<button class="btn-logout" onclick="cerrarSesion()">Salir</button>' +
        '</div>';
    document.body.prepend(nav);
}

// === Alertas ===
function mostrarAlerta(id, tipo, mensaje) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = mensaje;
    el.className = 'alert alert-' + tipo + ' visible';
}

function ocultarAlerta(id) {
    var el = document.getElementById(id);
    if (el) el.className = 'alert';
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
    return '<span class="badge ' + (c[rol] || 'badge-primary') + '">' + rol + '</span>';
}

function estadoBadge(activo) {
    return activo ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>';
}

function stockBadge(stock) {
    if (stock > 10) return '<span class="badge badge-success">' + stock + ' en stock</span>';
    if (stock > 0) return '<span class="badge badge-warning">¡Solo ' + stock + '!</span>';
    return '<span class="badge badge-danger">Agotado</span>';
}

function condicionBadge(condicion) {
    var c = { nuevo: 'badge-primary', reacondicionado: 'badge-warning', poco_uso: 'badge-success' };
    var t = { nuevo: 'Nuevo', reacondicionado: 'Reacondicionado', poco_uso: 'Poco uso' };
    return '<span class="badge ' + (c[condicion] || 'badge-primary') + '">' + (t[condicion] || condicion) + '</span>';
}

// === Render tarjeta de producto (reutilizable) ===
function renderProductCard(p) {
    var img = (p.imagenes && p.imagenes.length > 0) ?
        '<img src="' + p.imagenes[0].url + '" style="width:100%;height:180px;object-fit:cover;">' :
        '<div style="width:100%;height:180px;background:var(--gray-100);display:flex;align-items:center;justify-content:center;font-size:3rem;color:var(--gray-300);">📦</div>';

    var precioHTML = '<span style="font-size:1.2rem;font-weight:700;color:var(--primary);">' + formatPrecio(p.precio) + '</span>';
    if (p.precioOriginal && p.precioOriginal > p.precio) {
        precioHTML += ' <span style="font-size:0.85rem;color:var(--gray-500);text-decoration:line-through;">' + formatPrecio(p.precioOriginal) + '</span>';
    }

    return '<div style="background:var(--white);border-radius:12px;box-shadow:var(--shadow);overflow:hidden;cursor:pointer;transition:transform 0.2s" ' +
        'onclick="window.location.href=\'' + prefix + 'producto.html?id=' + p._id + '\'" ' +
        'onmouseover="this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.transform=\'none\'">' +
        img +
        '<div style="padding:1rem;">' +
        '<h3 style="font-size:1rem;margin-bottom:0.25rem;">' + p.nombre + '</h3>' +
        '<div style="font-size:0.8rem;color:var(--gray-500);margin-bottom:0.5rem;">' + (p.marca || '') + ' ' + condicionBadge(p.condicion) + '</div>' +
        precioHTML +
        '<div style="margin-top:0.25rem;">' + stockBadge(p.stock) + '</div>' +
        '</div></div>';
}