// ============================================
// ElectroShop - Iniciar sesión (migrado a jQuery)
// ============================================
$(function() {
    construirFooterES();
    // Si ya está logueado, redirigir
    if (estaLogueado()) window.location.href = 'perfil.html';

    $('#formLogin').on('submit', async function(e) {
        e.preventDefault();
        var correo = $('#correo').val().trim();
        var contrasena = $('#contrasena').val();
        var $alerta = $('#alerta');

        limpiarErrores();
        var hayErrores = false;
        function error(id, msg) {
            marcarCampoError(id, msg);
            if (!hayErrores) $('#' + id).trigger('focus');
            hayErrores = true;
        }
        if (!correo) error('correo', 'El correo es obligatorio');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) error('correo', 'Ingresa un correo válido');
        if (!contrasena) error('contrasena', 'La contraseña es obligatoria');
        if (hayErrores) return;

        botonCargando('btnLogin', true, 'Ingresando...');

        try {
            var r = await apiLogin(correo, contrasena);

            if (r.exito) {
                guardarSesion(r.datos.token, r.datos.usuario);
                $alerta.text('✅ ' + r.mensaje).attr('class', 'alert alert-success visible');
                setTimeout(function() {
                    window.location.href = r.datos.usuario.rol === 'admin' ? '../admin/usuarios.html' : 'perfil.html';
                }, 800);
            } else {
                var msg = r.mensaje;
                if (r.minutosRestantes) msg += ' (' + r.minutosRestantes + ' min)';
                if (r.intentosRestantes !== undefined) msg += ' — Intentos: ' + r.intentosRestantes;
                $alerta.text(msg).attr('class', 'alert alert-error visible');
            }
        } catch (err) {
            $alerta.text('Error de conexión. ¿Está corriendo el backend?').attr('class', 'alert alert-error visible');
        } finally {
            botonCargando('btnLogin', false);
        }
    });
});
