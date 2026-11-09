// ============================================
// ElectroShop Vendedor - Mis Productos (migrado a jQuery)
// ============================================
$(function() {
    if (!requiereVendedor()) return;
    renderNavbarVendedor('productos');

    var esc = escaparHtml;
    // Productos cargados, indexados por _id (antes se pasaba el objeto entero en un onclick inline)
    var productosPorId = {};

    async function cargarCategorias() {
        var r = await apiArbolCategorias(true);
        if (!r.exito) return;
        var $sel = $('#pCategoria');
        r.datos.arbol.forEach(function(c) {
            var id = c._id || c.id;
            $sel.append($('<option>', { value: id }).text((c.icono || '') + ' ' + c.nombre));
            if (c.subcategorias) c.subcategorias.forEach(function(s) {
                $sel.append($('<option>', { value: (s._id || s.id) }).text(' — ' + s.nombre));
            });
        });
    }

    async function cargar() {
        var $tbody = $('#tablaBody');
        mostrarSpinner();
        try {
            var r = await apiVendedorProductos();
            if (!r.exito) { $tbody.html('<tr><td colspan="6" class="text-center text-muted">Error</td></tr>'); return; }
            var ps = r.datos.productos;
            productosPorId = {};
            if (ps.length === 0) { $tbody.html('<tr><td colspan="6" class="text-center text-muted">Aún no tienes productos. ¡Crea el primero!</td></tr>'); return; }
            $tbody.html(ps.map(function(p) {
                productosPorId[p._id] = p;
                var cat = p.categoria ? p.categoria.nombre : '—';
                return '<tr>' +
                    '<td><strong>' + esc(p.nombre) + '</strong><br><span class="text-muted" style="font-size:0.72rem">' + esc(p.marca || '') + '</span></td>' +
                    '<td>' + esc(cat) + '</td><td>' + formatPrecio(p.precio) + '</td><td>' + stockBadge(p.stock) + '</td><td>' + estadoBadge(p.activo) + '</td>' +
                    '<td><button class="btn btn-sm btn-primary" data-action="editar-producto" data-id="' + esc(p._id) + '">Editar</button> ' +
                    '<button class="btn btn-sm btn-danger" data-action="eliminar-producto" data-id="' + esc(p._id) + '">🗑️</button></td></tr>';
            }).join(''));
        } finally {
            ocultarSpinner();
        }
    }

    function abrirCrear() {
        $('#modalTitulo').text('Nuevo Producto');
        $('#prodId').val('');
        $('#pNombre, #pSku, #pPrecio, #pStock, #pDescripcion').val('');
        $('#pMarca').val('Genérico');
        $('#modal').addClass('visible');
    }
    function editar(p) {
        $('#modalTitulo').text('Editar Producto');
        $('#prodId').val(p._id);
        $('#pNombre').val(p.nombre);
        $('#pSku').val(p.sku || '');
        $('#pMarca').val(p.marca || '');
        $('#pPrecio').val(p.precio);
        $('#pStock').val(p.stock);
        $('#pCondicion').val(p.condicion || 'nuevo');
        $('#pDescripcion').val(p.descripcion || '');
        $('#pCategoria').val((p.categoria && (p.categoria._id || p.categoria)) || '');
        $('#modal').addClass('visible');
    }
    function cerrar() { $('#modal').removeClass('visible'); }

    async function guardar() {
        var datos = {
            nombre: $('#pNombre').val().trim(),
            sku: $('#pSku').val().trim(),
            marca: $('#pMarca').val().trim(),
            categoria: $('#pCategoria').val(),
            precio: parseFloat($('#pPrecio').val()),
            stock: parseInt($('#pStock').val()),
            condicion: $('#pCondicion').val(),
            descripcion: $('#pDescripcion').val().trim()
        };
        var id = $('#prodId').val();
        botonCargando('btnGuardarProducto', true, 'Guardando...');
        try {
            var r = id ? await apiVendedorEditarProducto(id, datos) : await apiVendedorCrearProducto(datos);
            if (r.exito) { mostrarAlerta('alerta', 'success', 'Producto guardado'); cerrar(); cargar(); }
            else mostrarAlerta('alerta', 'danger', (r.errores && r.errores[0]) ? r.errores[0].mensaje : r.mensaje);
        } finally {
            botonCargando('btnGuardarProducto', false);
        }
    }

    async function eliminar(id) {
        if (!confirm('¿Eliminar este producto?')) return;
        var r = await apiVendedorEliminarProducto(id);
        if (r.exito) mostrarAlerta('alerta', 'success', 'Producto eliminado'); else mostrarAlerta('alerta', 'danger', r.mensaje);
        cargar();
    }

    // === Handlers delegados (antes onclick inline) ===
    $(document).on('click', '[data-action="nuevo-producto"]', function() { abrirCrear(); });
    $(document).on('click', '[data-action="cerrar-modal"]', function() { cerrar(); });
    $(document).on('click', '[data-action="guardar-producto"]', function() { guardar(); });
    $(document).on('click', '[data-action="editar-producto"]', function() {
        var p = productosPorId[$(this).attr('data-id')];
        if (p) editar(p);
    });
    $(document).on('click', '[data-action="eliminar-producto"]', function() {
        eliminar($(this).attr('data-id'));
    });

    $.extend(window, {
        cargarCategorias: cargarCategorias,
        cargar: cargar,
        abrirCrear: abrirCrear,
        editar: editar,
        cerrar: cerrar,
        guardar: guardar,
        eliminar: eliminar
    });

    cargarCategorias();
    cargar();
});
