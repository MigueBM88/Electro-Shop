// ============================================
// ElectroShop - Catálogo (migrado a jQuery)
// ============================================
$(function() {
    construirFooterES();
    if (!requiereAuth()) return;
    renderNavbar('catalogo');

    var esc = escaparHtml;

    // Tarjeta de categoría/subcategoría (click y hover vía handlers delegados)
    function tarjetaCategoria(c, iconoDef, estilo, hover, estiloIcono, estiloNombre, extra) {
        var icono = c.icono || iconoDef;
        return '<div class="es-cat-card" style="' + estilo + '" ' +
            'data-action="ver-categoria" data-id="' + esc(c._id) + '" data-nombre="' + esc(c.nombre) + '" data-icono="' + esc(icono) + '" ' +
            'data-hover="' + hover + '">' +
            '<div style="' + estiloIcono + '">' + esc(icono) + '</div>' +
            '<div style="' + estiloNombre + '">' + esc(c.nombre) + '</div>' +
            (extra || '') +
            '</div>';
    }

    // === Cargar categorías principales ===
    async function cargarCategorias() {
        mostrarSpinner();
        try {
            var r = await apiCategoriasPrincipales();
            var $grid = $('#gridCategorias');

            if (r.exito) {
                if (r.datos.categorias.length === 0) {
                    $grid.html('<p class="text-muted">No hay categorías disponibles todavía. El administrador debe crearlas desde el panel admin.</p>');
                    return;
                }

                $grid.html(r.datos.categorias.map(function(c) {
                    return tarjetaCategoria(c, '📦',
                        'background:var(--white);border-radius:12px;box-shadow:var(--shadow);padding:1.5rem;text-align:center;cursor:pointer;transition:transform 0.2s',
                        'translateY(-3px)',
                        'font-size:2.5rem;margin-bottom:0.5rem;',
                        'font-weight:600;font-size:1rem;margin-bottom:0.25rem;',
                        '<div style="font-size:0.8rem;color:var(--gray-500);">' + esc(c.cantidadProductos || 0) + ' productos</div>');
                }).join(''));
            }
        } catch (e) {
            mostrarAlerta('alerta', 'error', 'Error al cargar categorías. ¿Está corriendo el backend?');
        } finally {
            ocultarSpinner();
        }
    }

    // === Ver productos de una categoría ===
    async function verCategoria(id, nombre, icono) {
        $('#vistaCategorias').addClass('hidden');
        $('#vistaProductos').removeClass('hidden');
        $('#tituloCategoria').text(icono + ' ' + nombre);

        // Cargar subcategorías
        try {
            var r = await apiSubcategorias(id);
            var $gridSub = $('#gridSubcats');

            if (r.exito && r.datos.subcategorias && r.datos.subcategorias.length > 0) {
                $gridSub.html(r.datos.subcategorias.map(function(s) {
                    return tarjetaCategoria(s, '📁',
                        'background:var(--white);border-radius:12px;box-shadow:var(--shadow);padding:1rem;text-align:center;cursor:pointer;transition:transform 0.2s',
                        'translateY(-2px)',
                        'font-size:1.5rem;',
                        'font-weight:600;font-size:0.9rem;');
                }).join(''));
            } else {
                $gridSub.html('');
            }
        } catch (e) { /* ignorar */ }

        // Cargar productos
        cargarProductosCategoria(id, 1);
    }

    // === Cargar productos con paginación ===
    async function cargarProductosCategoria(catId, pagina) {
        mostrarSpinner();
        try {
            var r = await apiProductosPorCategoria(catId, '?pagina=' + pagina + '&limite=8');
            var $grid = $('#gridProductos');

            if (r.exito) {
                if (r.datos.productos.length === 0) {
                    $grid.html('<p class="text-muted">No hay productos disponibles en esta categoría</p>');
                    $('#paginacion').html('');
                    return;
                }

                $grid.html(r.datos.productos.map(function(p) {
                    return renderProductCard(p);
                }).join(''));

                // Paginación
                var pag = r.datos.paginacion;
                var pagHTML = 'Página ' + esc(pag.pagina) + ' de ' + esc(pag.totalPaginas) + ' (' + esc(pag.total) + ' productos) ';
                if (pag.pagina > 1) pagHTML += '<button class="btn btn-sm btn-outline" data-action="pagina-categoria" data-cat="' + esc(catId) + '" data-pagina="' + (pag.pagina - 1) + '">← Anterior</button> ';
                if (pag.pagina < pag.totalPaginas) pagHTML += '<button class="btn btn-sm btn-outline" data-action="pagina-categoria" data-cat="' + esc(catId) + '" data-pagina="' + (pag.pagina + 1) + '">Siguiente →</button>';
                $('#paginacion').html(pagHTML);
            }
        } catch (e) {
            mostrarAlerta('alerta', 'error', 'Error al cargar productos');
        } finally {
            ocultarSpinner();
        }
    }

    // === Volver ===
    function volverACategorias() {
        $('#vistaProductos').addClass('hidden');
        $('#vistaCategorias').removeClass('hidden');
    }

    // === Handlers delegados (antes onclick/onmouseover inline) ===
    $(document).on('click', '[data-action="ver-categoria"]', function() {
        var $c = $(this);
        verCategoria($c.attr('data-id'), $c.attr('data-nombre'), $c.attr('data-icono'));
    });
    $(document).on('click', '[data-action="pagina-categoria"]', function() {
        cargarProductosCategoria($(this).attr('data-cat'), parseInt($(this).attr('data-pagina'), 10));
    });
    $(document).on('click', '[data-action="volver-categorias"]', function() { volverACategorias(); });

    $.extend(window, {
        cargarCategorias: cargarCategorias,
        verCategoria: verCategoria,
        cargarProductosCategoria: cargarProductosCategoria,
        volverACategorias: volverACategorias
    });

    cargarCategorias();
});
