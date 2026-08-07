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
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<DashboardDataDto> GetStatsByInventoryFiltersAsync(Guid tenantId, ProductReportFilterDto filter){
        // 1. Obtener la fecha de inicio según el período seleccionado
        DateTime startDate = CalculateStartDate(filter.Period);

        // 2. Si hay filtro por nombre, traemos solo los IDs de productos coincidentes.
        var productFilterNameOnly = new ProductReportFilterDto { Name = filter.Name };
        var filteredProducts = await _productService.GetFilteredProductsAsync(productFilterNameOnly, tenantId);
        var filteredProductsList = filteredProducts.ToList();
        var filteredProductIds = filteredProductsList.Select(p => p.Id).ToHashSet();

        // 3. Consultar ventas filtrando desde la fecha calculada (startDate)
        var sales = await _saleRepository.GetSalesWithDetailsAsync(tenantId, startDate);

        // 4. Filtrar los detalles de ventas pertenecientes a los productos encontrados
        var filteredDetails = sales
            .SelectMany(s => s.Details)
            .Where(d => filteredProductIds.Contains(d.ProductId))
            .ToList();

        decimal totalRevenue = filteredDetails.Sum(d => d.Quantity * d.UnitPrice);
        int unitsSold = filteredDetails.Sum(d => d.Quantity);
        int lowStockCount = filteredProductsList.Count(p => p.Stock <= p.MinimumStock);

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

        //Para armar el grafico
        bool isToday = string.Equals(filter.Period, "hoy", StringComparison.OrdinalIgnoreCase);

        var salesTimeline = sales
            .SelectMany(s => s.Details.Select(d => new { Sale = s, Detail = d }))
            .Where(x => filteredProductIds.Contains(x.Detail.ProductId))
            .GroupBy(x => isToday 
                ? x.Sale.CreatedAt.ToString("HH:00") 
                : x.Sale.CreatedAt.ToString("dd/MM"))
            .Select(g => new SalesTimelineDto
            {
                Date = g.Key,
                Total = g.Sum(x => x.Detail.Quantity * x.Detail.UnitPrice)
            })
            .OrderBy(t => t.Date)
            .ToList();

        return new DashboardDataDto
        {
            Metrics = new DashboardMetricsDto
            {
                TotalRevenue = totalRevenue,
                TotalSalesCount = unitsSold,
                ActiveProductsCount = filteredProductsList.Count,
                LowStockAlertsCount = lowStockCount
            },
            TopProducts = topProducts,
            SalesTimeline = salesTimeline 
        };
    }

    // Método auxiliar para determinar la fecha inicial considerando la Zona Horaria
    private DateTime CalculateStartDate(string? period){
        // 1. Definir la zona horaria de Argentina (UTC-3)
        TimeZoneInfo argentinaZone = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time"); 
        // Para que funcione en cualquier sistema operativo (Windows/Linux/Docker):
        try
        {
            argentinaZone = TimeZoneInfo.FindSystemTimeZoneById("America/Argentina/Buenos_Aires");
        }
        catch
        {
            // En Windows fallback
            argentinaZone = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
        }

        // 2. Obtener la hora actual de Argentina y extraer el inicio de hoy (00:00:00 local)
        DateTime nowArgentina = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, argentinaZone);
        DateTime inicioHoyArgentina = nowArgentina.Date; 

        DateTime inicioHoyUtc = TimeZoneInfo.ConvertTimeToUtc(inicioHoyArgentina, argentinaZone);

        return period?.ToLower() switch
        {
            "hoy" => inicioHoyUtc,
            "semana" => TimeZoneInfo.ConvertTimeToUtc(inicioHoyArgentina.AddDays(-(int)inicioHoyArgentina.DayOfWeek), argentinaZone),
            "mes" => TimeZoneInfo.ConvertTimeToUtc(new DateTime(inicioHoyArgentina.Year, inicioHoyArgentina.Month, 1), argentinaZone),
            "anio" => TimeZoneInfo.ConvertTimeToUtc(new DateTime(inicioHoyArgentina.Year, 1, 1), argentinaZone),
            _ => DateTime.UtcNow.AddDays(-30)
        };
    }

    public async Task<byte[]> GenerateStatsPdfAsync(Guid tenantId, ProductReportFilterDto filter)
    {
        var stats = await GetStatsByInventoryFiltersAsync(tenantId, filter);

        var primaryColor = "#1C562A"; // Verde institucional
        var bgLight = "#F8FAFC";      // Slate 50
        var borderLight = "#E2E8F0";  // Slate 200
        var textMuted = "#64748B";    // Slate 500

        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(
        OperatingSystem.IsWindows() ? "Argentina Standard Time" : "America/Argentina/Buenos_Aires");
        var fechaEmision = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor("#0F172A"));

                // Encabezado + Caja de Filtro
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Reporte de Estadísticas de Inventario").FontSize(18).ExtraBold().FontColor(primaryColor);
                            c.Item().Text($"Generado el: {fechaEmision:dd/MM/yyyy HH:mm}").FontSize(8).FontColor(textMuted);
                        });
                    });

                    col.Item().PaddingTop(8).Background(bgLight).Border(1).BorderColor(borderLight).Padding(6).Row(row =>
                    {
                        row.RelativeItem().Text($"Filtro: {(string.IsNullOrWhiteSpace(filter.Name) ? "Todos" : filter.Name)}").FontSize(8).Bold();
                        row.RelativeItem().AlignRight().Text($"Período: {(string.IsNullOrWhiteSpace(filter.Period) ? "Últimos 30 días" : filter.Period)}").FontSize(8).Bold();
                    });

                    col.Item().PaddingTop(8).LineHorizontal(1).LineColor(borderLight);
                });

                // Contenido
                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(15);

                    // KPIs estructurados con Row / Column
                    col.Item().Text("Resumen General").FontSize(12).Bold().FontColor(primaryColor);
                    col.Item().Column(kpiCol =>
                    {
                        kpiCol.Spacing(8);

                        // Fila 1 de tarjetas
                        kpiCol.Item().Row(row =>
                        {
                            row.Spacing(8);

                            row.RelativeItem().Border(1).BorderColor(borderLight).Background(bgLight).Padding(8).Column(c =>
                            {
                                c.Item().Text("INGRESOS TOTALES (30D)").FontSize(8).Bold().FontColor(textMuted);
                                c.Item().Text($"$ {stats.Metrics.TotalRevenue:N2}").FontSize(14).Bold().FontColor("#059669");
                            });

                            row.RelativeItem().Border(1).BorderColor(borderLight).Background(bgLight).Padding(8).Column(c =>
                            {
                                c.Item().Text("UNIDADES VENDIDAS").FontSize(8).Bold().FontColor(textMuted);
                                c.Item().Text($"{stats.Metrics.TotalSalesCount:N0} u.").FontSize(14).Bold().FontColor("#0284C7");
                            });
                        });

                        // Fila 2 de tarjetas
                        kpiCol.Item().Row(row =>
                        {
                            row.Spacing(8);

                            row.RelativeItem().Border(1).BorderColor(borderLight).Background(bgLight).Padding(8).Column(c =>
                            {
                                c.Item().Text("PRODUCTOS FILTRADOS").FontSize(8).Bold().FontColor(textMuted);
                                c.Item().Text($"{stats.Metrics.ActiveProductsCount:N0} ítems").FontSize(14).Bold();
                            });

                            row.RelativeItem().Border(1).BorderColor(borderLight).Background(bgLight).Padding(8).Column(c =>
                            {
                                c.Item().Text("ALERTAS DE STOCK BAJO").FontSize(8).Bold().FontColor(textMuted);
                                c.Item().Text($"{stats.Metrics.LowStockAlertsCount:N0} alertas").FontSize(14).Bold().FontColor("#D97706");
                            });
                        });
                    });

                    // Tabla de Productos Más Vendidos
                    col.Item().Text("Productos Más Vendidos").FontSize(12).Bold().FontColor(primaryColor);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(primaryColor).Padding(5).Text("Producto").Bold().FontColor(Colors.White).FontSize(8);
                            header.Cell().Background(primaryColor).Padding(5).AlignRight().Text("Cant. Vendida").Bold().FontColor(Colors.White).FontSize(8);
                            header.Cell().Background(primaryColor).Padding(5).AlignRight().Text("Total").Bold().FontColor(Colors.White).FontSize(8);
                        });

                        foreach (var top in stats.TopProducts)
                        {
                            table.Cell().BorderBottom(1).BorderColor(borderLight).Padding(5).Text(top.ProductName).FontSize(9);
                            table.Cell().BorderBottom(1).BorderColor(borderLight).Padding(5).AlignRight().Text(top.SalesCount.ToString()).FontSize(9);
                            table.Cell().BorderBottom(1).BorderColor(borderLight).Padding(5).AlignRight().Text($"$ {top.TotalAmount:N2}").FontSize(9).Bold();
                        }
                    });
                });

                // Pie de página
                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text("Reporte del sistema del Stock y Ventas").FontSize(7).FontColor(textMuted);
                    row.RelativeItem().AlignRight().Text(t =>
                    {
                        t.DefaultTextStyle(x => x.FontSize(8).FontColor(textMuted));
                        t.Span("Página ");
                        t.CurrentPageNumber();
                        t.Span(" de ");
                        t.TotalPages();
                    });
                });
            });
        }).GeneratePdf();
    }
}