// ============================================
// ElectroShop - Servicio API COMPLETO
// ============================================
const API_URL = 'http://localhost:5000/api';

// === Sesión ===
function getToken() { return localStorage.getItem('es_token'); }

function getUsuario() { var d = localStorage.getItem('es_user'); return d ? JSON.parse(d) : null; }

function guardarSesion(token, usuario) { localStorage.setItem('es_token', token);
    localStorage.setItem('es_user', JSON.stringify(usuario)); }

function cerrarSesion() {
    localStorage.removeItem('es_token');
    localStorage.removeItem('es_user');
    window.location.replace('/index.html');
}

function estaLogueado() { return !!getToken(); }

function authHeaders() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }; }

// ============================================
// AUTH
// ============================================
async function apiRegistro(datos) {
    return (await fetch(API_URL + '/auth/registro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })).json();
}
async function apiLogin(correo, contrasena) {
    return (await fetch(API_URL + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, contrasena }) })).json();
}
async function apiObtenerPerfil() {
    return (await fetch(API_URL + '/auth/perfil', { headers: authHeaders() })).json();
}
async function apiEditarPerfil(datos) {
    return (await fetch(API_URL + '/auth/perfil', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}

// ============================================
// ADMIN - USUARIOS
// ============================================
async function apiListarUsuarios(params) {
    return (await fetch(API_URL + '/admin/users' + (params || ''), { headers: authHeaders() })).json();
}
async function apiCambiarRol(id, rol) {
    return (await fetch(API_URL + '/admin/users/' + id + '/rol', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ rol }) })).json();
}
async function apiDesactivarUsuario(id) {
    return (await fetch(API_URL + '/admin/users/' + id + '/desactivar', { method: 'PUT', headers: authHeaders() })).json();
}
async function apiReactivarUsuario(id) {
    return (await fetch(API_URL + '/admin/users/' + id + '/reactivar', { method: 'PUT', headers: authHeaders() })).json();
}

// ============================================
// CATEGORÍAS - PÚBLICO
// ============================================
async function apiCategoriasPrincipales() {
    return (await fetch(API_URL + '/categorias')).json();
}
async function apiSubcategorias(id) {
    return (await fetch(API_URL + '/categorias/' + id + '/subcategorias')).json();
}
async function apiArbolCategorias(soloActivas) {
    return (await fetch(API_URL + '/categorias/arbol?activas=' + (soloActivas ? 'true' : 'false'))).json();
}

// ============================================
// CATEGORÍAS - ADMIN
// ============================================
async function apiCrearCategoria(datos) {
    return (await fetch(API_URL + '/categorias', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiEditarCategoria(id, datos) {
    return (await fetch(API_URL + '/categorias/' + id, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiEliminarCategoria(id) {
    return (await fetch(API_URL + '/categorias/' + id, { method: 'DELETE', headers: authHeaders() })).json();
}

// ============================================
// PRODUCTOS - PÚBLICO
// ============================================
async function apiProductosPorCategoria(catId, params) {
    return (await fetch(API_URL + '/productos/categoria/' + catId + (params || ''))).json();
}
async function apiBuscarProductos(params) {
    return (await fetch(API_URL + '/productos/buscar' + (params || ''))).json();
}
async function apiProductoDetalle(id) {
    return (await fetch(API_URL + '/productos/' + id)).json();
}
async function apiMarcas() {
    return (await fetch(API_URL + '/productos/marcas')).json();
}

// ============================================
// PRODUCTOS - ADMIN
// ============================================
async function apiListarProductosAdmin(params) {
    return (await fetch(API_URL + '/productos/admin/lista' + (params || ''), { headers: authHeaders() })).json();
}
async function apiCrearProducto(datos) {
    return (await fetch(API_URL + '/productos', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiEditarProducto(id, datos) {
    return (await fetch(API_URL + '/productos/' + id, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiEliminarProducto(id) {
    return (await fetch(API_URL + '/productos/' + id, { method: 'DELETE', headers: authHeaders() })).json();
}

// ============================================
// CARRITO (cliente)
// ============================================
async function apiObtenerCarrito() {
    return (await fetch(API_URL + '/carrito', { headers: authHeaders() })).json();
}
async function apiAgregarAlCarrito(productoId, cantidad) {
    return (await fetch(API_URL + '/carrito/items', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ productoId: productoId, cantidad: cantidad || 1 }) })).json();
}
async function apiActualizarItemCarrito(productoId, cantidad) {
    return (await fetch(API_URL + '/carrito/items/' + productoId, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ cantidad: cantidad }) })).json();
}
async function apiEliminarItemCarrito(productoId) {
    return (await fetch(API_URL + '/carrito/items/' + productoId, { method: 'DELETE', headers: authHeaders() })).json();
}
async function apiVaciarCarrito() {
    return (await fetch(API_URL + '/carrito', { method: 'DELETE', headers: authHeaders() })).json();
}

// ============================================
// PEDIDOS (cliente)
// ============================================
async function apiCheckout(datos) {
    return (await fetch(API_URL + '/pedidos/checkout', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiMisPedidos(params) {
    return (await fetch(API_URL + '/pedidos' + (params || ''), { headers: authHeaders() })).json();
}
async function apiDetallePedido(id) {
    return (await fetch(API_URL + '/pedidos/' + id, { headers: authHeaders() })).json();
}
async function apiCancelarPedido(id) {
    return (await fetch(API_URL + '/pedidos/' + id + '/cancelar', { method: 'PUT', headers: authHeaders() })).json();
}

// ============================================
// PEDIDOS (admin)
// ============================================
async function apiListarPedidosAdmin(params) {
    return (await fetch(API_URL + '/pedidos/admin/lista' + (params || ''), { headers: authHeaders() })).json();
}
async function apiActualizarEstadoPedido(id, estado, nota) {
    return (await fetch(API_URL + '/pedidos/' + id + '/estado', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ estado: estado, nota: nota || '' }) })).json();
}

// ============================================
// RESEÑAS
// ============================================
async function apiResenasProducto(productoId) {
    return (await fetch(API_URL + '/resenas/producto/' + productoId)).json();
}
async function apiCrearResena(datos) {
    return (await fetch(API_URL + '/resenas', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiEliminarResena(id) {
    return (await fetch(API_URL + '/resenas/' + id, { method: 'DELETE', headers: authHeaders() })).json();
}
async function apiListarResenasAdmin(params) {
    return (await fetch(API_URL + '/resenas/admin/lista' + (params || ''), { headers: authHeaders() })).json();
}
async function apiModerarResena(id, estado) {
    return (await fetch(API_URL + '/resenas/' + id + '/moderar', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ estado: estado }) })).json();
}

// ============================================
// INVENTARIO (admin)
// ============================================
async function apiInventarioResumen() {
    return (await fetch(API_URL + '/inventario/resumen', { headers: authHeaders() })).json();
}
async function apiInventarioAlertas() {
    return (await fetch(API_URL + '/inventario/alertas', { headers: authHeaders() })).json();
}
async function apiInventarioMovimientos(params) {
    return (await fetch(API_URL + '/inventario/movimientos' + (params || ''), { headers: authHeaders() })).json();
}
async function apiAjustarStock(datos) {
    return (await fetch(API_URL + '/inventario/ajuste', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}

// ============================================
// REPORTES (admin)
// ============================================
async function apiReporteResumen() {
    return (await fetch(API_URL + '/reportes/resumen', { headers: authHeaders() })).json();
}
async function apiReporteVentasPorDia(dias) {
    return (await fetch(API_URL + '/reportes/ventas-por-dia?dias=' + (dias || 30), { headers: authHeaders() })).json();
}
async function apiReporteProductosTop(limite) {
    return (await fetch(API_URL + '/reportes/productos-top?limite=' + (limite || 10), { headers: authHeaders() })).json();
}
async function apiReportePedidosPorEstado() {
    return (await fetch(API_URL + '/reportes/pedidos-por-estado', { headers: authHeaders() })).json();
}

// ============================================
// TRADE-IN
// ============================================
async function apiCrearTradeIn(datos) {
    return (await fetch(API_URL + '/tradein', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiMisTradeIn() {
    return (await fetch(API_URL + '/tradein/mias', { headers: authHeaders() })).json();
}
async function apiDetalleTradeIn(id) {
    return (await fetch(API_URL + '/tradein/' + id, { headers: authHeaders() })).json();
}
async function apiListarTradeInAdmin(params) {
    return (await fetch(API_URL + '/tradein/admin/lista' + (params || ''), { headers: authHeaders() })).json();
}
async function apiEvaluarTradeIn(id, datos) {
    return (await fetch(API_URL + '/tradein/' + id + '/evaluar', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}

// ============================================
// VENDEDOR EXTERNO
// ============================================
async function apiVendedorProductos() {
    return (await fetch(API_URL + '/vendedor/productos', { headers: authHeaders() })).json();
}
async function apiVendedorCrearProducto(datos) {
    return (await fetch(API_URL + '/vendedor/productos', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiVendedorEditarProducto(id, datos) {
    return (await fetch(API_URL + '/vendedor/productos/' + id, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) })).json();
}
async function apiVendedorEliminarProducto(id) {
    return (await fetch(API_URL + '/vendedor/productos/' + id, { method: 'DELETE', headers: authHeaders() })).json();
}
async function apiVendedorVentas() {
    return (await fetch(API_URL + '/vendedor/ventas', { headers: authHeaders() })).json();
}
