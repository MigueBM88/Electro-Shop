// ============================================
// ElectroShop Admin - Productos (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereAdmin()) return;
    renderNavbarAdmin('productos');

    var esc = escaparHtml;
    var paginaActual = 1;
    var timerBusqueda = null;

    // === Cargar selects de categorías ===
    async function cargarSelectCategorias() {
        try {
            var r = await apiArbolCategorias(true);
            if (r.exito) {
                var $selFiltro = $('#fCategoria');
                var $selModal = $('#prodCategoria');
                r.datos.arbol.forEach(function(c) {
                    var id = c._id || c.id;
                    $selFiltro.append($('<option>', { value: id }).text((c.icono || '') + ' ' + c.nombre));
                    $selModal.append($('<option>', { value: id }).text((c.icono || '') + ' ' + c.nombre));
                    if (c.subcategorias) {
                        c.subcategorias.forEach(function(s) {
                            var sid = s._id || s.id;
                            $selFiltro.append($('<option>', { value: sid }).text(' — ' + s.nombre));
                            $selModal.append($('<option>', { value: sid }).text(' — ' + s.nombre));
                        });
                    }
                });
            }
        } catch (e) { /* ignorar */ }
    }

    // === Cargar tabla de productos ===
    async function cargarProductos() {
        var params = '?pagina=1&limite=1000'; // DataTables pagina en el navegador
        var categoria = $('#fCategoria').val();
        var condicion = $('#fCondicion').val();
        var activo = $('#fActivo').val();

        if (categoria) params += '&categoria=' + categoria;
        if (condicion) params += '&condicion=' + condicion;
        if (activo) params += '&activo=' + activo;

        mostrarSpinner();
        try {
            var r = await apiListarProductosAdmin(params);
            var $tbody = $('#tablaBody');
            limpiarDataTable('#tablaProductos');

            if (r.exito) {
                var productos = r.datos.productos;

                if (productos.length === 0) {
                    $tbody.html('<tr><td colspan="7" class="text-center text-muted">No se encontraron productos</td></tr>');
                    return;
                }

                $tbody.html(productos.map(function(p) {
                    var id = p._id || p.id;
                    var catNombre = (p.categoria && p.categoria.nombre) ? p.categoria.nombre : 'Sin categoría';
                    return '<tr>' +
                        '<td><strong>' + esc(p.nombre) + '</strong><br><span class="text-muted" style="font-size:0.75rem">' + esc(p.marca || '') + ' · SKU: ' + esc(p.sku || '—') + '</span></td>' +
                        '<td>' + esc(catNombre) + '</td>' +
                        '<td data-order="' + esc(p.precio) + '">' + formatPrecio(p.precio) + '</td>' +
                        '<td data-order="' + esc(p.stock) + '">' + stockBadge(p.stock) + '</td>' +
                        '<td>' + condicionBadge(p.condicion) + '</td>' +
                        '<td>' + estadoBadge(p.activo) + '</td>' +
                        '<td>' +
                        '<button class="btn btn-sm btn-primary" data-action="editar-producto" data-id="' + esc(id) + '" style="margin-right:0.4rem;margin-bottom:0.3rem">Editar</button>' +
                        '<button class="btn btn-sm btn-danger" data-action="eliminar-producto" data-id="' + esc(id) + '" data-nombre="' + esc(p.nombre) + '">Eliminar</button>' +
                        '</td>' +
                        '</tr>';
                }).join(''));

                // DataTables: búsqueda, orden y paginación
                activarDataTable('#tablaProductos', {
                    columnDefs: [{ targets: 6, orderable: false, searchable: false }]
                });
            } else {
                mostrarErrorModal(r.mensaje);
            }
        } catch (e) {
            mostrarErrorModal('Error de conexión');
        } finally {
            ocultarSpinner();
        }
    }

    // === Filtros ===
    $('#fCategoria, #fCondicion, #fActivo').on('change', function() {
        paginaActual = 1;
        cargarProductos();
    });

    // === Modal Crear ===
    function abrirModalCrear() {
        limpiarErrores();
        $('#modalTitulo').text('Nuevo Producto');
        $('#modalProdId').val('');
        $('#prodNombre').val('');
        $('#prodSku').val('');
        $('#prodCategoria').val('');
        $('#prodMarca').val('Genérico');
        $('#prodPrecio').val('');
        $('#prodStock').val('');
        $('#prodCondicion').val('nuevo');
        $('#prodPrecioOriginal').val('');
        $('#prodDescripcion').val('');
        $('#prodDatasheet').val('');
        $('#prodSpecs').val('');
        $('#modalProducto').addClass('visible');
    }

    // === Modal Editar ===
    async function abrirModalEditar(id) {
        limpiarErrores();
        try {
            var r = await apiProductoDetalle(id);
            if (!r.exito) {
                mostrarErrorModal('No se pudo cargar el producto');
                return;
            }

            var p = r.datos.producto;
            $('#modalTitulo').text('Editar Producto');
            $('#modalProdId').val(id);
            $('#prodNombre').val(p.nombre || '');
            $('#prodSku').val(p.sku || '');
            $('#prodCategoria').val((p.categoria && (p.categoria._id || p.categoria.id || p.categoria)) || '');
            $('#prodMarca').val(p.marca || 'Genérico');
            $('#prodPrecio').val(p.precio || '');
            $('#prodStock').val(p.stock || 0);
            $('#prodCondicion').val(p.condicion || 'nuevo');
            $('#prodPrecioOriginal').val(p.precioOriginal || '');
            $('#prodDescripcion').val(p.descripcion || '');
            $('#prodDatasheet').val(p.datasheetUrl || '');

            // Especificaciones a texto
            var specsTexto = '';
            if (p.especificaciones && p.especificaciones.length > 0) {
                specsTexto = p.especificaciones.map(function(s) {
                    return s.nombre + ': ' + s.valor;
                }).join('\n');
            }
            $('#prodSpecs').val(specsTexto);

            $('#modalProducto').addClass('visible');
        } catch (e) {
            mostrarErrorModal('Error de conexión');
        }
    }

    function cerrarModal() {
        $('#modalProducto').removeClass('visible');
    }

    // === Guardar producto (crear o editar) ===
    async function guardarProducto() {
        var id = $('#modalProdId').val();

        var nombre = $('#prodNombre').val().trim();
        var categoria = $('#prodCategoria').val();
        var precio = $('#prodPrecio').val();
        var stock = $('#prodStock').val();
        var descripcion = $('#prodDescripcion').val().trim();

        limpiarErrores();
        var hayErrores = false;
        function error(id, msg) {
            marcarCampoError(id, msg);
            if (!hayErrores) $('#' + id).trigger('focus');
            hayErrores = true;
        }
        if (!nombre) error('prodNombre', 'El nombre es obligatorio');
        else if (nombre.length < 2 || nombre.length > 150) error('prodNombre', 'El nombre debe tener entre 2 y 150 caracteres');
        if ($('#prodSku').val().trim().length > 50) error('prodSku', 'El SKU no puede exceder 50 caracteres');
        if ($('#prodMarca').val().trim().length > 80) error('prodMarca', 'La marca no puede exceder 80 caracteres');
        var precioOrigVal = $('#prodPrecioOriginal').val();
        if (precioOrigVal && parseFloat(precioOrigVal) < 0) error('prodPrecioOriginal', 'El precio original no puede ser negativo');
        if (!categoria) error('prodCategoria', 'Selecciona una categoría');
        if (!precio) error('prodPrecio', 'El precio es obligatorio');
        else if (parseFloat(precio) < 0) error('prodPrecio', 'El precio no puede ser negativo');
        if (stock === '') error('prodStock', 'El stock es obligatorio');
        else if (!/^\d+$/.test(stock)) error('prodStock', 'El stock debe ser un número entero mayor o igual a 0');
        if (!descripcion) error('prodDescripcion', 'La descripción es obligatoria');
        else if (descripcion.length > 2000) error('prodDescripcion', 'La descripción no puede exceder 2000 caracteres');
        if (hayErrores) return;

        // Parsear especificaciones
        var specsTexto = $('#prodSpecs').val().trim();
        var especificaciones = [];
        if (specsTexto) {
            specsTexto.split('\n').forEach(function(linea) {
                var partes = linea.split(':');
                if (partes.length >= 2) {
                    especificaciones.push({
                        nombre: partes[0].trim(),
                        valor: partes.slice(1).join(':').trim()
                    });
                }
            });
        }

        var datos = {
            nombre: nombre,
            sku: $('#prodSku').val().trim(),
            categoria: categoria,
            marca: $('#prodMarca').val().trim() || 'Genérico',
            precio: parseFloat(precio),
            stock: parseInt(stock),
            condicion: $('#prodCondicion').val(),
            descripcion: descripcion,
            datasheetUrl: $('#prodDatasheet').val().trim(),
            especificaciones: especificaciones
        };

        var precioOrig = $('#prodPrecioOriginal').val();
        if (precioOrig) datos.precioOriginal = parseFloat(precioOrig);

        botonCargando('btnGuardarProducto', true, 'Guardando...');
        try {
            var r;
            if (id) {
                r = await apiEditarProducto(id, datos);
            } else {
                r = await apiCrearProducto(datos);
            }

            if (r.exito) {
                mostrarAlerta('alerta', 'success', '✅ ' + r.mensaje);
                cerrarModal();
                cargarProductos();
            } else {
                mostrarErrorModal(r.mensaje, 'No se pudo guardar el producto');
            }
        } catch (e) {
            mostrarErrorModal('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.', 'Error de conexión');
        } finally {
            botonCargando('btnGuardarProducto', false);
        }
    }

    // === Eliminar producto ===
    async function eliminarProd(id, nombre) {
        if (!(await confirmarModal('¿Eliminar el producto "' + nombre + '"? Esta acción no se puede deshacer.'))) return;

        try {
            var r = await apiEliminarProducto(id);
            if (r.exito) {
                mostrarAlerta('alerta', 'success', '✅ ' + r.mensaje);
                cargarProductos();
            } else {
                mostrarErrorModal(r.mensaje, 'No se pudo eliminar el producto');
            }
        } catch (e) {
            mostrarErrorModal('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.', 'Error de conexión');
        }
    }

    // === Handlers delegados (antes onclick inline) ===
    $(document).on('click', '[data-action="nuevo-producto"]', function() { abrirModalCrear(); });
    $(document).on('click', '[data-action="cerrar-modal"]', function() { cerrarModal(); });
    $(document).on('click', '[data-action="guardar-producto"]', function() { guardarProducto(); });
    $(document).on('click', '[data-action="editar-producto"]', function() {
        abrirModalEditar($(this).attr('data-id'));
    });
    $(document).on('click', '[data-action="eliminar-producto"]', function() {
        eliminarProd($(this).attr('data-id'), $(this).attr('data-nombre'));
    });

    // Mantener accesibles globalmente las funciones que antes eran globales
    $.extend(window, {
        cargarSelectCategorias: cargarSelectCategorias,
        cargarProductos: cargarProductos,
        abrirModalCrear: abrirModalCrear,
        abrirModalEditar: abrirModalEditar,
        cerrarModal: cerrarModal,
        guardarProducto: guardarProducto,
        eliminarProd: eliminarProd
    });

    // === Iniciar ===
    cargarSelectCategorias();
    cargarProductos();
});
