// ============================================
// ElectroShop Admin - Reportes (migrado a jQuery; Chart.js sin cambios)
// ============================================
$(function() {
    if (!requiereAdmin()) return;
    renderNavbarAdmin('reportes');

    var esc = escaparHtml;
    var charts = {};
    var COLORES = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

    async function cargarKpis() {
        var r = await apiReporteResumen();
        if (!r.exito) return;
        var k = r.datos.resumen;
        function card(titulo, valor, color) {
            return '<div class="card" style="text-align:center;padding:1rem">' +
                '<div style="font-size:1.5rem;font-weight:700;color:' + (color || 'var(--primary)') + '">' + esc(valor) + '</div>' +
                '<div class="text-muted" style="font-size:0.78rem">' + titulo + '</div></div>';
        }
        $('#kpis').html(
            card('Ingresos totales', formatPrecio(k.ingresos), 'var(--success)') +
            card('Pedidos (venta)', k.pedidosVenta) +
            card('Ticket promedio', formatPrecio(k.ticketPromedio)) +
            card('Total pedidos', k.totalPedidos) +
            card('Clientes', k.totalClientes) +
            card('Productos activos', k.totalProductos));
    }

    async function cargarVentas() {
        var dias = parseInt($('#rango').val());
        var r = await apiReporteVentasPorDia(dias);
        if (!r.exito) return;
        var serie = r.datos.serie;
        var labels = serie.map(function(s) { return s.fecha.slice(5); }); // MM-DD
        var data = serie.map(function(s) { return s.ingresos; });

        if (charts.ventas) charts.ventas.destroy();
        charts.ventas = new Chart($('#chartVentas')[0], {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ingresos (₡)', data: data,
                    borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)',
                    fill: true, tension: 0.3, pointRadius: 3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    async function cargarProductos() {
        var r = await apiReporteProductosTop(8);
        if (!r.exito) return;
        var ps = r.datos.productos;
        if (charts.productos) charts.productos.destroy();
        charts.productos = new Chart($('#chartProductos')[0], {
            type: 'bar',
            data: {
                labels: ps.map(function(p) { return p.nombre.length > 20 ? p.nombre.slice(0, 20) + '…' : p.nombre; }),
                datasets: [{ label: 'Unidades vendidas', data: ps.map(function(p) { return p.unidades; }), backgroundColor: '#16a34a' }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    async function cargarEstados() {
        var r = await apiReportePedidosPorEstado();
        if (!r.exito) return;
        var d = r.datos.distribucion;
        if (charts.estados) charts.estados.destroy();
        charts.estados = new Chart($('#chartEstados')[0], {
            type: 'doughnut',
            data: {
                labels: d.map(function(x) { return x.estado; }),
                datasets: [{ data: d.map(function(x) { return x.total; }), backgroundColor: COLORES }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    // === Handler delegado (antes onchange inline) ===
    $(document).on('change', '#rango', function() { cargarVentas(); });

    $.extend(window, {
        cargarKpis: cargarKpis,
        cargarVentas: cargarVentas,
        cargarProductos: cargarProductos,
        cargarEstados: cargarEstados,
        cargarTodo: cargarTodo
    });

    // Carga inicial: las 4 peticiones van en paralelo (igual que antes) y el
    // spinner se oculta cuando terminan todas, aunque alguna falle.
    async function cargarTodo() {
        mostrarSpinner();
        try {
            var resultados = await Promise.allSettled([cargarKpis(), cargarVentas(), cargarProductos(), cargarEstados()]);
            resultados.forEach(function(res) {
                if (res.status === 'rejected') console.error(res.reason);
            });
        } finally {
            ocultarSpinner();
        }
    }

    cargarTodo();
});
