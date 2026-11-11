// ============================================
// ElectroShop - Búsqueda avanzada (migrado a jQuery)
// ============================================
$(function() {
    construirFooterES();
    if (!requiereAuth()) return;
    renderNavbar('buscar');

    // === Cargar opciones de filtros (categorías y marcas) ===
    async function cargarFiltros() {
        try {
            var catRes = await apiArbolCategorias(true);
            if (catRes.exito) {
                var $sel = $('#fCategoria');
                catRes.datos.arbol.forEach(function(c) {
                    $sel.append($('<option>', { value: c._id }).text((c.icono || '') + ' ' + c.nombre));
                    if (c.subcategorias) {
                        c.subcategorias.forEach(function(s) {
                            $sel.append($('<option>', { value: s._id }).text(' — ' + s.nombre));
                        });
                    }
                });
            }
        } catch (e) { /* ignorar */ }

        try {
            var marcaRes = await apiMarcas();
            if (marcaRes.exito) {
                var $selMarca = $('#fMarca');
                marcaRes.datos.marcas.forEach(function(m) {
                    $selMarca.append($('<option>', { value: m }).text(m));
                });
            }
        } catch (e) { /* ignorar */ }
    }

    // === Buscar productos ===
    async function buscar(pagina) {
        var params = new URLSearchParams();
        var q = $('#fBusqueda').val().trim();
        if (q) params.set('q', q);
        if ($('#fCategoria').val()) params.set('categoria', $('#fCategoria').val());
        if ($('#fMarca').val()) params.set('marca', $('#fMarca').val());
        if ($('#fPrecioMin').val()) params.set('precioMin', $('#fPrecioMin').val());
        if ($('#fPrecioMax').val()) params.set('precioMax', $('#fPrecioMax').val());
        if ($('#fDisponibilidad').val()) params.set('disponibilidad', $('#fDisponibilidad').val());
        if ($('#fCondicion').val()) params.set('condicion', $('#fCondicion').val());
        if ($('#fOrdenar').val()) params.set('ordenar', $('#fOrdenar').val());
        params.set('pagina', pagina || 1);
        params.set('limite', 12);

        mostrarSpinner();
        try {
            var r = await apiBuscarProductos('?' + params.toString());
            var $grid = $('#gridResultados');
            var $info = $('#infoResultados');

            if (r.exito) {
                var pag = r.datos.paginacion;

                if (r.datos.productos.length === 0) {
                    $grid.html('<p class="text-muted">No se encontraron resultados para tu búsqueda</p>');
                    $info.text('0 resultados');
                    $('#paginacion').html('');

                    // Mostrar sugerencias
                    if (r.datos.sugerencias && r.datos.sugerencias.length > 0) {
                        $('#zonaSugerencias').removeClass('hidden');
                        $('#gridSugerencias').html(r.datos.sugerencias.map(function(p) {
                            return renderProductCard(p);
                        }).join(''));
                    }
                } else {
                    $('#zonaSugerencias').addClass('hidden');
                    $info.text(pag.total + ' resultado(s) encontrado(s)');
                    $grid.html(r.datos.productos.map(function(p) {
                        return renderProductCard(p);
                    }).join(''));

                    // Paginación
                    var pagHTML = 'Pág. ' + escaparHtml(pag.pagina) + ' de ' + escaparHtml(pag.totalPaginas) + ' ';
                    if (pag.pagina > 1) pagHTML += '<button class="btn btn-sm btn-outline" data-action="buscar-pagina" data-pagina="' + (pag.pagina - 1) + '">← Anterior</button> ';
                    if (pag.pagina < pag.totalPaginas) pagHTML += '<button class="btn btn-sm btn-outline" data-action="buscar-pagina" data-pagina="' + (pag.pagina + 1) + '">Siguiente →</button>';
                    $('#paginacion').html(pagHTML);
                }
            }
        } catch (e) {
            mostrarErrorModal('Error de conexión al buscar');
        } finally {
            ocultarSpinner();
        }
    }

    // === Submit del formulario ===
    $('#formBuscar').on('submit', function(e) {
        e.preventDefault();
        buscar(1);
    });

    // === Paginación (antes onclick inline) ===
    $(document).on('click', '[data-action="buscar-pagina"]', function() {
        buscar(parseInt($(this).attr('data-pagina'), 10));
    });

    $.extend(window, { cargarFiltros: cargarFiltros, buscar: buscar });

    cargarFiltros();
});
