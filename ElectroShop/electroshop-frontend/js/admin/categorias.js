// ============================================
// ElectroShop Admin - Categorías (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAdmin()) return;
    renderNavbarAdmin('categorias');

    var esc = escaparHtml;
    var categoriasLista = [];

    // === Cargar árbol de categorías ===
    async function cargarArbol() {
        mostrarSpinner();
        try {
            var r = await apiArbolCategorias(false);
            if (r.exito) {
                categoriasLista = r.datos.arbol;
                var $contenedor = $('#arbolCategorias');

                if (r.datos.arbol.length === 0) {
                    $contenedor.html('<p class="text-muted">No hay categorías creadas. ¡Crea la primera!</p>');
                    return;
                }

                var html = '';
                r.datos.arbol.forEach(function(cat) {
                    html += renderTreeItem(cat, false);
                    if (cat.subcategorias) {
                        cat.subcategorias.forEach(function(sub) {
                            html += renderTreeItem(sub, true);
                        });
                    }
                });
                $contenedor.html(html);

                // Actualizar select de padre en modal
                actualizarSelectPadre();
            }
        } catch (e) {
            mostrarErrorModal('Error al cargar categorías');
        } finally {
            ocultarSpinner();
        }
    }

    function renderTreeItem(cat, esSub) {
        var id = cat._id || cat.id;
        return '<div style="padding:0.6rem 1rem;border:1px solid var(--gray-200);border-radius:var(--radius);margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between;background:var(--white);' + (esSub ? 'margin-left:2rem;border-left:3px solid var(--primary-light);' : '') + '">' +
            '<div style="display:flex;align-items:center;gap:0.75rem;">' +
            '<span style="font-size:1.3rem;">' + esc(cat.icono || '📦') + '</span>' +
            '<div>' +
            '<strong>' + esc(cat.nombre) + '</strong>' +
            (cat.esTradeIn ? ' <span class="badge badge-warning">Trade-In</span>' : '') +
            (!cat.activa ? ' <span class="badge badge-danger">Inactiva</span>' : '') +
            '<div style="font-size:0.75rem;color:var(--gray-500);">Orden: ' + esc(cat.orden) + (cat.cantidadProductos ? ' · ' + esc(cat.cantidadProductos) + ' productos' : '') + '</div>' +
            '</div>' +
            '</div>' +
            '<div style="display:flex;gap:0.5rem;">' +
            '<button class="btn btn-sm btn-primary" data-action="editar-categoria" data-id="' + esc(id) + '">Editar</button>' +
            '<button class="btn btn-sm btn-danger" data-action="eliminar-categoria" data-id="' + esc(id) + '" data-nombre="' + esc(cat.nombre) + '">Eliminar</button>' +
            '</div>' +
            '</div>';
    }

    function actualizarSelectPadre() {
        var $sel = $('#catPadre');
        $sel.html('<option value="">— Ninguna (categoría principal) —</option>');
        categoriasLista.forEach(function(cat) {
            $sel.append($('<option>', { value: (cat._id || cat.id) }).text((cat.icono || '') + ' ' + cat.nombre));
        });
    }

    // === Modal crear ===
    function abrirModalCrear() {
        limpiarErrores();
        $('#modalTitulo').text('Nueva Categoría');
        $('#modalCatId').val('');
        $('#catNombre').val('');
        $('#catDescripcion').val('');
        $('#catIcono').val('📦');
        $('#catPadre').val('');
        $('#catOrden').val('0');
        $('#catTradeIn').prop('checked', false);
        $('#modalCategoria').addClass('visible');
    }

    // === Modal editar ===
    function abrirModalEditar(id) {
        limpiarErrores();
        // Buscar la categoría en la lista
        var cat = buscarCategoria(id);
        if (!cat) return;

        $('#modalTitulo').text('Editar Categoría');
        $('#modalCatId').val(id);
        $('#catNombre').val(cat.nombre || '');
        $('#catDescripcion').val(cat.descripcion || '');
        $('#catIcono').val(cat.icono || '📦');
        $('#catPadre').val(cat.categoriaPadre || '');
        $('#catOrden').val(cat.orden || 0);
        $('#catTradeIn').prop('checked', cat.esTradeIn || false);
        $('#modalCategoria').addClass('visible');
    }

    function buscarCategoria(id) {
        for (var i = 0; i < categoriasLista.length; i++) {
            if ((categoriasLista[i]._id || categoriasLista[i].id) === id) return categoriasLista[i];
            if (categoriasLista[i].subcategorias) {
                for (var j = 0; j < categoriasLista[i].subcategorias.length; j++) {
                    var sub = categoriasLista[i].subcategorias[j];
                    if ((sub._id || sub.id) === id) return sub;
                }
            }
        }
        return null;
    }

    function cerrarModal() {
        $('#modalCategoria').removeClass('visible');
    }

    // === Guardar (crear o editar) ===
    async function guardarCategoria() {
        var id = $('#modalCatId').val();
        var datos = {
            nombre: $('#catNombre').val().trim(),
            descripcion: $('#catDescripcion').val().trim(),
            icono: $('#catIcono').val().trim() || '📦',
            categoriaPadre: $('#catPadre').val() || null,
            orden: parseInt($('#catOrden').val()) || 0,
            esTradeIn: $('#catTradeIn').prop('checked')
        };

        limpiarErrores();
        if (!datos.nombre) {
            marcarCampoError('catNombre', 'El nombre es obligatorio');
            $('#catNombre').trigger('focus');
            return;
        }
        var hayErr = false;
        if (datos.nombre.length < 2 || datos.nombre.length > 80) { marcarCampoError('catNombre', 'El nombre debe tener entre 2 y 80 caracteres'); hayErr = true; }
        if (datos.descripcion.length > 500) { marcarCampoError('catDescripcion', 'La descripción no puede exceder 500 caracteres'); hayErr = true; }
        if (datos.icono.length > 20) { marcarCampoError('catIcono', 'El icono no puede exceder 20 caracteres'); hayErr = true; }
        if (hayErr) { $('.input-error').first().trigger('focus'); return; }

        botonCargando('btnGuardarCat', true, 'Guardando...');
        try {
            var r;
            if (id) {
                r = await apiEditarCategoria(id, datos);
            } else {
                r = await apiCrearCategoria(datos);
            }

            if (r.exito) {
                mostrarAlerta('alerta', 'success', '✅ ' + r.mensaje);
                cerrarModal();
                cargarArbol();
            } else {
                mostrarErrorModal(r.mensaje, 'No se pudo guardar la categoría');
            }
        } catch (e) {
            mostrarErrorModal('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.', 'Error de conexión');
        } finally {
            botonCargando('btnGuardarCat', false);
        }
    }

    // === Eliminar ===
    async function eliminarCat(id, nombre) {
        if (!(await confirmarModal('¿Eliminar la categoría "' + nombre + '"?'))) return;

        try {
            var r = await apiEliminarCategoria(id);
            if (r.exito) {
                mostrarAlerta('alerta', 'success', '✅ ' + r.mensaje);
                cargarArbol();
            } else {
                mostrarErrorModal(r.mensaje, 'No se pudo eliminar la categoría');
            }
        } catch (e) {
            mostrarErrorModal('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.', 'Error de conexión');
        }
    }

    // === Handlers delegados (antes onclick inline) ===
    $(document).on('click', '[data-action="nueva-categoria"]', function() { abrirModalCrear(); });
    $(document).on('click', '[data-action="cerrar-modal"]', function() { cerrarModal(); });
    $(document).on('click', '[data-action="guardar-categoria"]', function() { guardarCategoria(); });
    $(document).on('click', '[data-action="editar-categoria"]', function() {
        abrirModalEditar($(this).attr('data-id'));
    });
    $(document).on('click', '[data-action="eliminar-categoria"]', function() {
        eliminarCat($(this).attr('data-id'), $(this).attr('data-nombre'));
    });

    $.extend(window, {
        cargarArbol: cargarArbol,
        abrirModalCrear: abrirModalCrear,
        abrirModalEditar: abrirModalEditar,
        cerrarModal: cerrarModal,
        guardarCategoria: guardarCategoria,
        eliminarCat: eliminarCat
    });

    cargarArbol();
});
