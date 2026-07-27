using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Application.Services;

public class InventoryStatsService : IInventoryStatsService
{
    private readonly IProductService _productService;
    private readonly ISaleRepository _saleRepository;

    public InventoryStatsService(IProductService productService, ISaleRepository saleRepository)
    {
        _productService = productService;
        _saleRepository = saleRepository;
        // Configuramos la licencia gratuita de QuestPDF
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<DashboardDataDto> GetStatsByInventoryFiltersAsync(Guid tenantId, ProductReportFilterDto filter){
        // reuso el filtro que existe en el servicio de producto
        var filteredProducts = await _productService.GetFilteredProductsAsync(filter, tenantId);
        var filteredProductsList = filteredProducts.ToList();

        // se trae las ventas del ultimo mes
        var startDate = DateTime.UtcNow.AddDays(-30);
        var sales = await _saleRepository.GetSalesWithDetailsAsync(tenantId, startDate);

        // hashSet con los productos filtrados
        var filteredProductIds = filteredProductsList.Select(p => p.Id).ToHashSet();

        // Se filtran los SaleDetail de los productos filtrados antes
        var filteredDetails = sales
            .SelectMany(s => s.Details)
            .Where(d => filteredProductIds.Contains(d.ProductId))
            .ToList();

        
        //calculo de estadisticas (unidades vendidas y demas )
        decimal totalRevenue = filteredDetails.Sum(d => d.Quantity * d.UnitPrice);
        int unitsSold = filteredDetails.Sum(d => d.Quantity);
        
        // Alertas de stock critico 
        int lowStockCount = filteredProductsList.Count(p => p.Stock <= p.MinimumStock);

        // Se agrupan los productos mas vendidos con el filtro que esta activo
        var topProducts = filteredDetails
            .GroupBy(d => d.Product?.Name ?? "Producto Sin Nombre")
            .Select(g => new TopProductDto
            {
                ProductName = g.Key,
                SalesCount = g.Sum(d => d.Quantity),
                TotalAmount = g.Sum(d => d.Quantity * d.UnitPrice)
            })
            .OrderByDescending(p => p.SalesCount)
            .Take(4)
            .ToList();

        return new DashboardDataDto
        {
            Metrics = new DashboardMetricsDto
            {
                TotalRevenue = totalRevenue,
                TotalSalesCount = unitsSold,
                ActiveProductsCount = filteredProductsList.Count, // Cantidad de ítems en la grilla actual
                LowStockAlertsCount = lowStockCount
            },
            TopProducts = topProducts
        };
    }

    public async Task<byte[]> GenerateStatsPdfAsync(Guid tenantId, ProductReportFilterDto filter)
    {
        // Reutilizamos el cálculo de métricas de tu método
        var stats = await GetStatsByInventoryFiltersAsync(tenantId, filter);

        // Generamos el documento en memoria
        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11));

                // Encabezado
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("Reporte de Estadísticas de Inventario")
                           .FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
                        col.Item().Text($"Generado el: {DateTime.Now:dd/MM/yyyy HH:mm}")
                           .FontSize(9).FontColor(Colors.Grey.Medium);
                    });
                });

                // Contenido
                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(15);

                    // Métrica Resumen
                    col.Item().Text("Resumen General").FontSize(14).Bold();

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text("Ingresos Totales (30d)").Bold();
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text($"$ {stats.Metrics.TotalRevenue:N2}");

                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text("Unidades Vendidas").Bold();
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text($"{stats.Metrics.TotalSalesCount}");

                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text("Productos Filtrados").Bold();
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text($"{stats.Metrics.ActiveProductsCount}");

                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text("Alertas de Stock Bajo").Bold();
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(6).Text($"{stats.Metrics.LowStockAlertsCount}");
                    });

                    // Productos más vendidos
                    col.Item().Text("Productos Más Vendidos").FontSize(14).Bold();

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                        });

                        // Headers de la tabla
                        table.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Producto").Bold();
                        table.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Cant. Vendida").Bold();
                        table.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Total").Bold();

                        foreach (var top in stats.TopProducts)
                        {
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(top.ProductName);
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(top.SalesCount.ToString());
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"$ {top.TotalAmount:N2}");
                        }
                    });
                });

                // Pie de página
                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Página ");
                    text.CurrentPageNumber();
                });
            });
        }).GeneratePdf();

        return pdfBytes;
    }
}