
// ============================================
// ElectroShop - Servicio API
// ============================================
const API_URL = 'http://localhost:5000/api';

// === Sesión ===
function getToken() { return localStorage.getItem('es_token'); }
function getUsuario() { const d = localStorage.getItem('es_user'); return d ? JSON.parse(d) : null; }
function guardarSesion(token, usuario) { localStorage.setItem('es_token', token); localStorage.setItem('es_user', JSON.stringify(usuario)); }
function cerrarSesion() { localStorage.removeItem('es_token'); localStorage.removeItem('es_user'); window.location.href = '/index.html'; }
function estaLogueado() { return !!getToken(); }
function authHeaders() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() }; }

// === AUTH ===
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

// === ADMIN USUARIOS ===
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


