// ============================================
// ElectroShop - Registro (jQuery + jQuery Validation 1.20.0)
// ============================================
$(function() {
    construirFooterES();
    if (estaLogueado()) window.location.href = 'perfil.html';

    // Reglas personalizadas (iguales a las del backend en userValidators.js)
    $.validator.addMethod('soloLetras', function(value, el) {
        return this.optional(el) || /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value);
    }, 'El nombre solo puede contener letras y espacios');

    $.validator.addMethod('contrasenaSegura', function(value, el) {
        return this.optional(el) || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/.test(value);
    }, 'Debe incluir una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&#)');

    $('#formRegistro').validate({
        rules: {
            nombre: { required: true, minlength: 2, maxlength: 100, soloLetras: true },
            correo: { required: true, email: true },
            contrasena: { required: true, minlength: 8, contrasenaSegura: true },
            confirmarContrasena: { required: true, equalTo: '#contrasena' }
        },
        messages: {
            nombre: {
                required: 'El nombre es obligatorio',
                minlength: 'El nombre debe tener al menos 2 caracteres',
                maxlength: 'El nombre no puede exceder 100 caracteres'
            },
            correo: {
                required: 'El correo electrónico es obligatorio',
                email: 'Debe ingresar un correo electrónico válido'
            },
            contrasena: {
                required: 'La contraseña es obligatoria',
                minlength: 'La contraseña debe tener al menos 8 caracteres'
            },
            confirmarContrasena: {
                required: 'Debe confirmar la contraseña',
                equalTo: 'Las contraseñas no coinciden'
            }
        },
        // Mostrar errores en los <div class="error-text"> existentes
        errorPlacement: function(error, element) {
            $('#err-' + element.attr('id')).text(error.text()).addClass('visible');
        },
        highlight: function(el) { $(el).addClass('error'); },
        unhighlight: function(el) {
            $(el).removeClass('error');
            $('#err-' + $(el).attr('id')).text('').removeClass('visible');
        },
        submitHandler: async function() {
            var $alerta = $('#alerta');

            var datos = {
                nombre: $('#nombre').val().trim(),
                correo: $('#correo').val().trim(),
                contrasena: $('#contrasena').val(),
                confirmarContrasena: $('#confirmarContrasena').val()
            };

            botonCargando('btnReg', true, 'Registrando...');

            try {
                var r = await apiRegistro(datos);
                if (r.exito) {
                    guardarSesion(r.datos.token, r.datos.usuario);
                    $alerta.text('✅ ' + r.mensaje).attr('class', 'alert alert-success visible');
                    setTimeout(function() { window.location.href = 'perfil.html'; }, 1200);
                } else {
                    $alerta.text(r.mensaje).attr('class', 'alert alert-error visible');
                    // Errores por campo que vengan del backend
                    if (r.errores) {
                        r.errores.forEach(function(err) {
                            $('#' + err.campo).addClass('error');
                            $('#err-' + err.campo).text(err.mensaje).addClass('visible');
                        });
                    }
                }
            } catch (err) {
                $alerta.text('Error de conexión con el servidor').attr('class', 'alert alert-error visible');
            } finally {
                botonCargando('btnReg', false);
            }
        }
    });
});
