// ============================================
// ElectroShop - Mi Perfil (migrado a jQuery)
// ============================================
$(function() {
    construirFooterES();
    // Verificar autenticación
    if (!requiereAuth()) return;
    renderNavbar('perfil');

    var perfilData = {};

    // Cargar datos del perfil
    async function cargarPerfil() {
        mostrarSpinner();
        try {
            var r = await apiObtenerPerfil();
            if (r.exito) {
                var u = r.datos.usuario;
                perfilData = u;
                $('#vNombre').text(u.nombre);
                $('#vCorreo').text(u.correo);
                $('#vTelefono').text(u.telefono || 'No registrado');
                $('#vProvincia').text((u.direccion && u.direccion.provincia) || '—');
                $('#vCanton').text((u.direccion && u.direccion.canton) || '—');
                $('#vDistrito').text((u.direccion && u.direccion.distrito) || '—');
                $('#vDetalle').text((u.direccion && u.direccion.detalle) || '—');
                $('#vRol').html(rolBadge(u.rol));
                $('#vFecha').text(formatFecha(u.fechaRegistro));
            }
        } catch (e) {
            mostrarErrorModal('Error al cargar el perfil');
        } finally {
            ocultarSpinner();
        }
    }

    // Activar modo edición
    function activarEdicion() {
        $('#vistaVer').addClass('hidden');
        $('#vistaEditar').removeClass('hidden');
        $('#eNombre').val(perfilData.nombre || '');
        $('#eTelefono').val(perfilData.telefono || '');
        $('#eProvincia').val((perfilData.direccion && perfilData.direccion.provincia) || '');
        $('#eCanton').val((perfilData.direccion && perfilData.direccion.canton) || '');
        $('#eDistrito').val((perfilData.direccion && perfilData.direccion.distrito) || '');
        $('#eDetalle').val((perfilData.direccion && perfilData.direccion.detalle) || '');
        ocultarAlerta('alerta');
    }

    // Cancelar edición
    function cancelarEdicion() {
        limpiarErrores();
        $('#vistaEditar').addClass('hidden');
        $('#vistaVer').removeClass('hidden');
        ocultarAlerta('alerta');
    }

    // Guardar cambios
    $('#formEditar').on('submit', async function(e) {
        e.preventDefault();
        limpiarErrores();
        var hayErrores = false;
        function error(id, msg) {
            marcarCampoError(id, msg);
            if (!hayErrores) $('#' + id).trigger('focus');
            hayErrores = true;
        }
        var nombreVal = $('#eNombre').val().trim();
        var telVal = $('#eTelefono').val().trim();
        if (!nombreVal) error('eNombre', 'El nombre es obligatorio');
        else if (nombreVal.length < 2) error('eNombre', 'El nombre debe tener al menos 2 caracteres');
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombreVal)) error('eNombre', 'El nombre solo puede contener letras y espacios');
        else if (nombreVal.length > 100) error('eNombre', 'El nombre no puede exceder 100 caracteres');
        if (telVal && !/^[0-9]{8}$/.test(telVal)) error('eTelefono', 'El teléfono debe tener exactamente 8 dígitos (sin espacios ni guiones)');
        if (!$('#eProvincia').val().trim()) error('eProvincia', 'La provincia no puede estar vacía');
        if (!$('#eCanton').val().trim()) error('eCanton', 'El cantón no puede estar vacío');
        if (!$('#eDistrito').val().trim()) error('eDistrito', 'El distrito no puede estar vacío');
        if ($('#eDetalle').val().trim().length > 500) error('eDetalle', 'El detalle no puede exceder 500 caracteres');
        if (hayErrores) return;
        botonCargando('btnGuardar', true, 'Guardando...');

        var datos = {
            nombre: $('#eNombre').val().trim(),
            telefono: $('#eTelefono').val().trim(),
            direccion: {
                provincia: $('#eProvincia').val().trim(),
                canton: $('#eCanton').val().trim(),
                distrito: $('#eDistrito').val().trim(),
                detalle: $('#eDetalle').val().trim()
            }
        };

        try {
            var r = await apiEditarPerfil(datos);
            if (r.exito) {
                mostrarAlerta('alerta', 'success', '✅ Perfil actualizado exitosamente');
                cancelarEdicion();
                await cargarPerfil();
                // Actualizar nombre en navbar
                var usr = getUsuario();
                usr.nombre = datos.nombre;
                localStorage.setItem('es_user', JSON.stringify(usr));
            } else {
                mostrarErrorModal(r.mensaje);
            }
        } catch (e) {
            mostrarErrorModal('Error de conexión');
        } finally {
            botonCargando('btnGuardar', false);
        }
    });

    // === Handlers delegados (antes onclick inline) ===
    $(document).on('click', '[data-action="activar-edicion"]', function() { activarEdicion(); });
    $(document).on('click', '[data-action="cancelar-edicion"]', function() { cancelarEdicion(); });

    $.extend(window, { cargarPerfil: cargarPerfil, activarEdicion: activarEdicion, cancelarEdicion: cancelarEdicion });

    // Iniciar
    cargarPerfil();
});
