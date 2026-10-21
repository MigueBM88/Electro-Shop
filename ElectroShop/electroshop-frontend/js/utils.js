
// ============================================
// ElectroShop - Navbar dinámica y utilidades
// ============================================

// Detectar si estamos en carpeta admin/
const esAdmin = window.location.pathname.includes('/admin/');
const prefix = esAdmin ? '../' : '';

// === Navbar para páginas de USUARIO ===
function renderNavbar(paginaActiva) {
  const usuario = getUsuario();
  if (!usuario) return;

  const links = [
    { href: prefix + 'perfil.html', texto: '👤 Perfil', id: 'perfil' }
  ];

  if (usuario.rol === 'admin') {
    links.push({ href: prefix + 'admin/usuarios.html', texto: '⚙️ Admin', id: 'admin' });
  }

  const linksHTML = links.map(function(l) {
    return '<a href="' + l.href + '" class="' + (paginaActiva === l.id ? 'active' : '') + '">' + l.texto + '</a>';
  }).join('');

  const nav = document.createElement('nav');
  nav.className = 'navbar';
  nav.innerHTML =
    '<a href="' + prefix + 'perfil.html" class="navbar-brand">🔌 Electro<span>Shop</span></a>' +
    '<div class="navbar-links">' + linksHTML + '</div>' +
    '<div class="navbar-user">' +
      '<span class="user-name">' + usuario.nombre + '</span>' +
      '<button class="btn-logout" onclick="cerrarSesion()">Salir</button>' +
    '</div>';

  document.body.prepend(nav);
}

// === Navbar para páginas ADMIN ===
function renderNavbarAdmin(paginaActiva) {
  const usuario = getUsuario();
  if (!usuario) return;

  const links = [
    { href: 'usuarios.html', texto: '👥 Usuarios', id: 'usuarios' },
    { href: '../perfil.html', texto: '← Mi Perfil', id: 'perfil' }
  ];

  const linksHTML = links.map(function(l) {
    return '<a href="' + l.href + '" class="' + (paginaActiva === l.id ? 'active' : '') + '">' + l.texto + '</a>';
  }).join('');

  const nav = document.createElement('nav');
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

// === Verificar autenticación ===
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

// === Helpers de formato ===
function formatFecha(f) { return new Date(f).toLocaleDateString('es-CR'); }

function rolBadge(rol) {
  var c = { admin: 'badge-warning', cliente: 'badge-primary', vendedor: 'badge-success' };
  return '<span class="badge ' + (c[rol] || 'badge-primary') + '">' + rol + '</span>';
}

function estadoBadge(activo) {
  return activo
    ? '<span class="badge badge-success">Activo</span>'
    : '<span class="badge badge-danger">Inactivo</span>';
}

