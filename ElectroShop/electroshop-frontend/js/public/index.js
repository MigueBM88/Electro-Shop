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

        if (!correo || !contrasena) {
            $alerta.text('Complete todos los campos').attr('class', 'alert alert-error visible');
            return;
        }

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
