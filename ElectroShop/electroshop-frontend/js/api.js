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
// apiFetch: envoltorio único para todas las llamadas al backend
//  - Sesión vencida (401 con token): cierra sesión y avisa con un modal.
//  - Sin conexión / servidor caído: devuelve { exito:false, mensaje } en vez de lanzar error.
//  - Respuesta que no es JSON: devuelve un error controlado.
// Así cada página solo revisa r.exito, igual que antes.
// ============================================
var sesionExpiradaMostrada = false;
async function apiFetch(url, opciones) {
    var resp;
    try {
        resp = await fetch(url, opciones);
    } catch (e) {
        return { exito: false, mensaje: 'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.', errorRed: true };
    }

    // 401 en una ruta protegida = token vencido o inválido (el login devuelve 401 sin token, eso no cuenta)
    if (resp.status === 401 && getToken() && url.indexOf('/auth/login') === -1) {
        if (!sesionExpiradaMostrada) {
            sesionExpiradaMostrada = true;
            localStorage.removeItem('es_token');
            localStorage.removeItem('es_user');
            if (window.mostrarInfoModal) {
                mostrarInfoModal('Por seguridad, tu sesión se cerró. Inicia sesión de nuevo para continuar.', 'Tu sesión expiró', 'warning')
                    .then(function() { window.location.replace('/index.html'); });
            } else {
                window.location.replace('/index.html');
            }
        }
        return { exito: false, mensaje: 'Tu sesión expiró', sesionExpirada: true };
    }

    try {
        return await resp.json();
    } catch (e) {
        return { exito: false, mensaje: 'El servidor respondió de forma inesperada (código ' + resp.status + ').' };
    }
}

// ============================================
// AUTH
// ============================================
async function apiRegistro(datos) {
    return apiFetch(API_URL + '/auth/registro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
}
async function apiLogin(correo, contrasena) {
    return apiFetch(API_URL + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, contrasena }) });
}
async function apiObtenerPerfil() {
    return apiFetch(API_URL + '/auth/perfil', { headers: authHeaders() });
}
async function apiEditarPerfil(datos) {
    return apiFetch(API_URL + '/auth/perfil', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
}

// ============================================
// ADMIN - USUARIOS
// ============================================
async function apiListarUsuarios(params) {
    return apiFetch(API_URL + '/admin/users' + (params || ''), { headers: authHeaders() });
}
async function apiCambiarRol(id, rol) {
    return apiFetch(API_URL + '/admin/users/' + id + '/rol', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ rol }) });
}
async function apiDesactivarUsuario(id) {
    return apiFetch(API_URL + '/admin/users/' + id + '/desactivar', { method: 'PUT', headers: authHeaders() });
}
async function apiReactivarUsuario(id) {
    return apiFetch(API_URL + '/admin/users/' + id + '/reactivar', { method: 'PUT', headers: authHeaders() });
}

// ============================================
// CATEGORÍAS - PÚBLICO
// ============================================
async function apiCategoriasPrincipales() {
    return apiFetch(API_URL + '/categorias');
}
async function apiSubcategorias(id) {
    return apiFetch(API_URL + '/categorias/' + id + '/subcategorias');
}
async function apiArbolCategorias(soloActivas) {
    return apiFetch(API_URL + '/categorias/arbol?activas=' + (soloActivas ? 'true' : 'false'));
}

// ============================================
// CATEGORÍAS - ADMIN
// ============================================
async function apiCrearCategoria(datos) {
    return apiFetch(API_URL + '/categorias', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiEditarCategoria(id, datos) {
    return apiFetch(API_URL + '/categorias/' + id, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiEliminarCategoria(id) {
    return apiFetch(API_URL + '/categorias/' + id, { method: 'DELETE', headers: authHeaders() });
}

// ============================================
// PRODUCTOS - PÚBLICO
// ============================================
async function apiProductosPorCategoria(catId, params) {
    return apiFetch(API_URL + '/productos/categoria/' + catId + (params || ''));
}
async function apiBuscarProductos(params) {
    return apiFetch(API_URL + '/productos/buscar' + (params || ''));
}
async function apiProductoDetalle(id) {
    return apiFetch(API_URL + '/productos/' + id);
}
async function apiMarcas() {
    return apiFetch(API_URL + '/productos/marcas');
}

// ============================================
// PRODUCTOS - ADMIN
// ============================================
async function apiListarProductosAdmin(params) {
    return apiFetch(API_URL + '/productos/admin/lista' + (params || ''), { headers: authHeaders() });
}
async function apiCrearProducto(datos) {
    return apiFetch(API_URL + '/productos', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiEditarProducto(id, datos) {
    return apiFetch(API_URL + '/productos/' + id, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiEliminarProducto(id) {
    return apiFetch(API_URL + '/productos/' + id, { method: 'DELETE', headers: authHeaders() });
}

// ============================================
// CARRITO (cliente)
// ============================================
async function apiObtenerCarrito() {
    return apiFetch(API_URL + '/carrito', { headers: authHeaders() });
}
async function apiAgregarAlCarrito(productoId, cantidad) {
    return apiFetch(API_URL + '/carrito/items', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ productoId: productoId, cantidad: cantidad || 1 }) });
}
async function apiActualizarItemCarrito(productoId, cantidad) {
    return apiFetch(API_URL + '/carrito/items/' + productoId, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ cantidad: cantidad }) });
}
async function apiEliminarItemCarrito(productoId) {
    return apiFetch(API_URL + '/carrito/items/' + productoId, { method: 'DELETE', headers: authHeaders() });
}
async function apiVaciarCarrito() {
    return apiFetch(API_URL + '/carrito', { method: 'DELETE', headers: authHeaders() });
}

// ============================================
// PEDIDOS (cliente)
// ============================================
async function apiCheckout(datos) {
    return apiFetch(API_URL + '/pedidos/checkout', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiMisPedidos(params) {
    return apiFetch(API_URL + '/pedidos' + (params || ''), { headers: authHeaders() });
}
async function apiDetallePedido(id) {
    return apiFetch(API_URL + '/pedidos/' + id, { headers: authHeaders() });
}
async function apiCancelarPedido(id) {
    return apiFetch(API_URL + '/pedidos/' + id + '/cancelar', { method: 'PUT', headers: authHeaders() });
}

// ============================================
// PEDIDOS (admin)
// ============================================
async function apiListarPedidosAdmin(params) {
    return apiFetch(API_URL + '/pedidos/admin/lista' + (params || ''), { headers: authHeaders() });
}
async function apiActualizarEstadoPedido(id, estado, nota) {
    return apiFetch(API_URL + '/pedidos/' + id + '/estado', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ estado: estado, nota: nota || '' }) });
}

// ============================================
// RESEÑAS
// ============================================
async function apiResenasProducto(productoId) {
    return apiFetch(API_URL + '/resenas/producto/' + productoId);
}
async function apiCrearResena(datos) {
    return apiFetch(API_URL + '/resenas', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiEliminarResena(id) {
    return apiFetch(API_URL + '/resenas/' + id, { method: 'DELETE', headers: authHeaders() });
}
async function apiListarResenasAdmin(params) {
    return apiFetch(API_URL + '/resenas/admin/lista' + (params || ''), { headers: authHeaders() });
}
async function apiModerarResena(id, estado) {
    return apiFetch(API_URL + '/resenas/' + id + '/moderar', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ estado: estado }) });
}

// ============================================
// INVENTARIO (admin)
// ============================================
async function apiInventarioResumen() {
    return apiFetch(API_URL + '/inventario/resumen', { headers: authHeaders() });
}
async function apiInventarioAlertas() {
    return apiFetch(API_URL + '/inventario/alertas', { headers: authHeaders() });
}
async function apiInventarioMovimientos(params) {
    return apiFetch(API_URL + '/inventario/movimientos' + (params || ''), { headers: authHeaders() });
}
async function apiAjustarStock(datos) {
    return apiFetch(API_URL + '/inventario/ajuste', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
}

// ============================================
// REPORTES (admin)
// ============================================
async function apiReporteResumen() {
    return apiFetch(API_URL + '/reportes/resumen', { headers: authHeaders() });
}
async function apiReporteVentasPorDia(dias) {
    return apiFetch(API_URL + '/reportes/ventas-por-dia?dias=' + (dias || 30), { headers: authHeaders() });
}
async function apiReporteProductosTop(limite) {
    return apiFetch(API_URL + '/reportes/productos-top?limite=' + (limite || 10), { headers: authHeaders() });
}
async function apiReportePedidosPorEstado() {
    return apiFetch(API_URL + '/reportes/pedidos-por-estado', { headers: authHeaders() });
}

// ============================================
// TRADE-IN
// ============================================
async function apiCrearTradeIn(datos) {
    return apiFetch(API_URL + '/tradein', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiMisTradeIn() {
    return apiFetch(API_URL + '/tradein/mias', { headers: authHeaders() });
}
async function apiDetalleTradeIn(id) {
    return apiFetch(API_URL + '/tradein/' + id, { headers: authHeaders() });
}
async function apiResponderTradeIn(id, aceptar) {
    return apiFetch(API_URL + '/tradein/' + id + '/responder', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ aceptar: aceptar }) });
}
async function apiProponerMontoTradeIn(id, monto) {
    return apiFetch(API_URL + '/tradein/' + id + '/responder', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ montoPropuesto: monto }) });
}
async function apiListarTradeInAdmin(params) {
    return apiFetch(API_URL + '/tradein/admin/lista' + (params || ''), { headers: authHeaders() });
}
async function apiEvaluarTradeIn(id, datos) {
    return apiFetch(API_URL + '/tradein/' + id + '/evaluar', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
}

// ============================================
// VENDEDOR EXTERNO
// ============================================
async function apiVendedorProductos() {
    return apiFetch(API_URL + '/vendedor/productos', { headers: authHeaders() });
}
async function apiVendedorCrearProducto(datos) {
    return apiFetch(API_URL + '/vendedor/productos', { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiVendedorEditarProducto(id, datos) {
    return apiFetch(API_URL + '/vendedor/productos/' + id, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
}
async function apiVendedorEliminarProducto(id) {
    return apiFetch(API_URL + '/vendedor/productos/' + id, { method: 'DELETE', headers: authHeaders() });
}
async function apiVendedorVentas() {
    return apiFetch(API_URL + '/vendedor/ventas', { headers: authHeaders() });
}


// ============================================
// Modo oscuro / claro (botón flotante en todas las páginas)
// ============================================
(function () {
    var guardado = localStorage.getItem('es_tema');
    var prefiereOscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var tema = guardado || (prefiereOscuro ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', tema);

    function crearBoton() {
        if (!window.jQuery) return; // jQuery debe cargarse antes que api.js
        if ($('.theme-toggle').length) return;
        var $html = $(document.documentElement);
        var $btn = $('<button>', { type: 'button', 'class': 'theme-toggle' });
        function actualizar() {
            var oscuro = $html.attr('data-theme') === 'dark';
            $btn.text(oscuro ? '☀️' : '🌙')
                .attr('title', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        }
        $btn.on('click', function () {
            var nuevo = $html.attr('data-theme') === 'dark' ? 'light' : 'dark';
            $html.attr('data-theme', nuevo);
            localStorage.setItem('es_tema', nuevo);
            actualizar();
        });
        actualizar();
        $('body').append($btn);
    }
    if (window.jQuery) $(crearBoton);
})();
