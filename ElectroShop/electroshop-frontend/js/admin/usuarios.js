// ============================================
// ElectroShop Admin - Usuarios (migrado a jQuery)
// ============================================
$(function() {
    // Verificar que sea admin
    if (!requiereAdmin()) return;
    renderNavbarAdmin('usuarios');

    var esc = escaparHtml;
    var tabla = null; // instancia de DataTables

    // === Cargar usuarios (DataTables maneja búsqueda, orden y paginación) ===
    async function cargarUsuarios() {
        var params = '?pagina=1&limite=1000';
        var rol = $('#fRol').val();
        var activo = $('#fActivo').val();
        if (rol) params += '&rol=' + rol;
        if (activo) params += '&activo=' + activo;

        mostrarSpinner();
        try {
            var r = await apiListarUsuarios(params);
            if (!r.exito) return mostrarAlerta('alerta', 'error', r.mensaje);

            var filas = r.datos.usuarios.map(function(u) {
                var id = u._id || u.id;
                return [
                    '<strong>' + esc(u.nombre) + '</strong>',
                    esc(u.correo),
                    rolBadge(u.rol),
                    estadoBadge(u.activo),
                    u.fechaRegistro, // se formatea en columnDefs (permite ordenar por fecha real)
                    '<button class="btn btn-sm btn-primary" data-action="abrir-modal-rol" data-id="' + esc(id) + '" data-nombre="' + esc(u.nombre) + '" data-rol="' + esc(u.rol) + '" style="margin-right:0.5rem">Rol</button>' +
                    (u.activo
                        ? '<button class="btn btn-sm btn-danger" data-action="toggle-estado" data-id="' + esc(id) + '" data-activar="false">Desactivar</button>'
                        : '<button class="btn btn-sm btn-success" data-action="toggle-estado" data-id="' + esc(id) + '" data-activar="true">Reactivar</button>')
                ];
            });

            if (tabla) {
                tabla.clear().rows.add(filas).draw(false);
            } else {
                tabla = $('#tablaUsuarios').DataTable({
                    data: filas,
                    pageLength: 10,
                    lengthMenu: [5, 10, 25, 50],
                    order: [[4, 'desc']],
                    columnDefs: [
                        { targets: 4, render: function(d, type) { return type === 'display' ? formatFecha(d) : d; } },
                        { targets: 5, orderable: false, searchable: false }
                    ],
                    language: { url: 'https://cdn.datatables.net/plug-ins/2.1.8/i18n/es-ES.json' }
                });
            }
        } catch (e) {
            mostrarAlerta('alerta', 'error', 'Error de conexión');
        } finally {
            ocultarSpinner();
        }
    }

    // === Filtros (rol y estado se filtran en el servidor) ===
    $('#fRol, #fActivo').on('change', cargarUsuarios);

    // === Modal Cambiar Rol ===
    function abrirModalRol(id, nombre, rolActual) {
        $('#modalUserId').val(id);
        $('#modalNombre').text(nombre);
        $('#modalSelectRol').val(rolActual);
        $('#modalRol').addClass('visible');
    }

    function cerrarModal() {
        $('#modalRol').removeClass('visible');
    }

    async function confirmarCambioRol() {
        var id = $('#modalUserId').val();
        var nuevoRol = $('#modalSelectRol').val();

        botonCargando('btnGuardarRol', true, 'Guardando...');
        try {
            var r = await apiCambiarRol(id, nuevoRol);
            if (r.exito) {
                mostrarAlerta('alerta', 'success', '✅ ' + r.mensaje);
            } else {
                mostrarAlerta('alerta', 'error', r.mensaje);
            }
            cerrarModal();
            cargarUsuarios();
        } catch (e) {
            mostrarAlerta('alerta', 'error', 'Error de conexión');
        } finally {
            botonCargando('btnGuardarRol', false);
        }
    }

    // === Activar / Desactivar ===
    async function toggleEstado(id, activar) {
        var msg = activar ? '¿Reactivar este usuario?' : '¿Desactivar este usuario? Se le notificará por correo.';
        if (!confirm(msg)) return;

        try {
            var r = activar ? await apiReactivarUsuario(id) : await apiDesactivarUsuario(id);
            if (r.exito) {
                mostrarAlerta('alerta', 'success', '✅ ' + r.mensaje);
            } else {
                mostrarAlerta('alerta', 'error', r.mensaje);
            }
            cargarUsuarios();
        } catch (e) {
            mostrarAlerta('alerta', 'error', 'Error de conexión');
        }
    }

    // === Handlers delegados (antes onclick inline; funcionan en todas las páginas de DataTables) ===
    $(document).on('click', '[data-action="abrir-modal-rol"]', function() {
        var $b = $(this);
        abrirModalRol($b.attr('data-id'), $b.attr('data-nombre'), $b.attr('data-rol'));
    });
    $(document).on('click', '[data-action="toggle-estado"]', function() {
        toggleEstado($(this).attr('data-id'), $(this).attr('data-activar') === 'true');
    });
    $(document).on('click', '[data-action="cerrar-modal"]', function() { cerrarModal(); });
    $(document).on('click', '[data-action="confirmar-cambio-rol"]', function() { confirmarCambioRol(); });

    $.extend(window, {
        cargarUsuarios: cargarUsuarios,
        abrirModalRol: abrirModalRol,
        cerrarModal: cerrarModal,
        confirmarCambioRol: confirmarCambioRol,
        toggleEstado: toggleEstado
    });

    // Iniciar
    cargarUsuarios();
});
