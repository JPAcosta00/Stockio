using Application.Interfaces;
using Domain.Entities; 
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using System.IO;
using Infraestructure.Data;
using System.Linq;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Application.DTOs;      //"insfrastructure" xq en la libreria se llama asi

namespace Infraestructure.Services
{
    public class ProductExportService : IProductExportService
    {
        private readonly ApplicationDbContext _context;

        public ProductExportService(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<byte[]> GenerateExcelAsync(IEnumerable<Product> products)
        {
            products ??= Enumerable.Empty<Product>();
            var productList = products.ToList(); // Convertimos a lista para calcular metadatos

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Inventario General");

                // -------------------------------------------------------------
                // 1. CABECERAS (Ahora con 8 columnas en total)
                // -------------------------------------------------------------
                worksheet.Cell(1, 1).Value = "Código de Barras";
                worksheet.Cell(1, 2).Value = "Nombre";
                worksheet.Cell(1, 3).Value = "Descripción";
                worksheet.Cell(1, 4).Value = "Categoría";
                worksheet.Cell(1, 5).Value = "Proveedor";
                worksheet.Cell(1, 6).Value = "Precio Unitario";
                worksheet.Cell(1, 7).Value = "Stock Disponible";
                worksheet.Cell(1, 8).Value = "Valor Total Stock";

                var headerRange = worksheet.Range("A1:H1");
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#1F4E78");
                headerRange.Style.Font.FontColor = XLColor.White;
                headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // -------------------------------------------------------------
                // 2. CARGA DE DATOS
                // -------------------------------------------------------------
                int startRow = 2;
                int currentRow = startRow;

                foreach (var prod in productList)
                {
                    decimal price = prod.Price;
                    int stock = prod.Stock;
                    decimal totalValue = price * stock;

                    worksheet.Cell(currentRow, 1).Value = prod.Barcode ?? "";
                    worksheet.Cell(currentRow, 2).Value = prod.Name ?? "";
                    worksheet.Cell(currentRow, 3).Value = prod.Description ?? "";
                    worksheet.Cell(currentRow, 4).Value = prod.Categoria.ToString(); // Categoría (Enum a texto)
                    worksheet.Cell(currentRow, 5).Value = prod.Provider?.Name ?? "Sin Proveedor"; // Nombre del Proveedor si existe

                    // Asignación explícita de valores numéricos (desplazados a columnas 6, 7 y 8)
                    worksheet.Cell(currentRow, 6).SetValue(price);
                    worksheet.Cell(currentRow, 7).SetValue(stock);
                    worksheet.Cell(currentRow, 8).SetValue(totalValue);

                    // Formatos de celda
                    worksheet.Cell(currentRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    worksheet.Cell(currentRow, 4).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                    worksheet.Cell(currentRow, 6).Style.NumberFormat.Format = "$#,##0.00";
                    worksheet.Cell(currentRow, 7).Style.NumberFormat.Format = "#,##0";
                    worksheet.Cell(currentRow, 8).Style.NumberFormat.Format = "$#,##0.00";

                    currentRow++;
                }

                // -------------------------------------------------------------
                // 3. FILA DE TOTALES Y RESUMEN
                // -------------------------------------------------------------
                if (productList.Any())
                {
                    decimal avgPrice = productList.Average(p => p.Price);
                    int totalStock = productList.Sum(p => p.Stock);
                    decimal grandTotalValue = productList.Sum(p => p.Price * p.Stock);

                    // Ubicamos la etiqueta de totales corrida hacia la columna de descripción/categoría
                    worksheet.Cell(currentRow, 3).Value = "TOTALES / PROMEDIOS:";
                    worksheet.Cell(currentRow, 3).Style.Font.Bold = true;
                    worksheet.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                    // Asignar los valores calculados en sus nuevas columnas correspondientes
                    worksheet.Cell(currentRow, 6).SetValue(avgPrice);
                    worksheet.Cell(currentRow, 6).Style.NumberFormat.Format = "$#,##0.00";

                    worksheet.Cell(currentRow, 7).SetValue(totalStock);
                    worksheet.Cell(currentRow, 7).Style.NumberFormat.Format = "#,##0";

                    worksheet.Cell(currentRow, 8).SetValue(grandTotalValue);
                    worksheet.Cell(currentRow, 8).Style.NumberFormat.Format = "$#,##0.00";

                    // Estilos para la fila de totales (Abarcando de la columna 1 a la 8)
                    var totalRange = worksheet.Range(currentRow, 1, currentRow, 8);
                    totalRange.Style.Font.Bold = true;
                    totalRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");
                    totalRange.Style.Border.TopBorder = XLBorderStyleValues.Thin;
                    totalRange.Style.Border.BottomBorder = XLBorderStyleValues.Double;

                    // -------------------------------------------------------------
                    // 4. TARJETAS DE RESUMEN EJECUTIVO (KPIs)
                    // -------------------------------------------------------------
                    int summaryStartRow = currentRow + 3;

                    worksheet.Cell(summaryStartRow, 1).Value = "MÉTRICA DE INVENTARIO";
                    worksheet.Cell(summaryStartRow, 2).Value = "VALOR";
                    var kpiHeader = worksheet.Range(summaryStartRow, 1, summaryStartRow, 2);
                    kpiHeader.Style.Font.Bold = true;
                    kpiHeader.Style.Fill.BackgroundColor = XLColor.FromHtml("#2F5597");
                    kpiHeader.Style.Font.FontColor = XLColor.White;

                    // Total Productos Únicos
                    worksheet.Cell(summaryStartRow + 1, 1).Value = "Variedad de Productos:";
                    worksheet.Cell(summaryStartRow + 1, 2).SetValue(productList.Count);
                    worksheet.Cell(summaryStartRow + 1, 2).Style.NumberFormat.Format = "#,##0";

                    // Total Unidades Físicas
                    worksheet.Cell(summaryStartRow + 2, 1).Value = "Total Unidades Físicas:";
                    worksheet.Cell(summaryStartRow + 2, 2).SetValue(totalStock);
                    worksheet.Cell(summaryStartRow + 2, 2).Style.NumberFormat.Format = "#,##0";

                    // Valorización Total
                    worksheet.Cell(summaryStartRow + 3, 1).Value = "Valorización Total del Stock:";
                    worksheet.Cell(summaryStartRow + 3, 2).SetValue(grandTotalValue);
                    worksheet.Cell(summaryStartRow + 3, 2).Style.NumberFormat.Format = "$#,##0.00";
                    worksheet.Cell(summaryStartRow + 3, 2).Style.Font.Bold = true;

                    // Bordes a la tabla de KPIs
                    var kpiTable = worksheet.Range(summaryStartRow, 1, summaryStartRow + 3, 2);
                    kpiTable.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                    kpiTable.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                }

                // -------------------------------------------------------------
                // 5. AJUSTE DE COLUMNAS Y SALIDA
                // -------------------------------------------------------------
                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    return stream.ToArray();
                }
            }
        }

        public async Task<byte[]> GeneratePdfAsync(IEnumerable<Product> products)
        {
            // Si la lista viene nula o vacía, asegura una lista vacía para evitar fallos
            products ??= Enumerable.Empty<Product>();
        
            // Calcular totales para el resumen del reporte
            decimal valorTotalInventario = products.Sum(p => p.Price * p.Stock);
            int totalItems = products.Sum(p => p.Stock);
        
            // Obtiene la hora de Argentina independientemente de si corre en Windows o Linux/Render
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "Argentina Standard Time" : "America/Argentina/Buenos_Aires");
            var fechaEmision = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
        
            var primaryColor = "#1C562A"; // Verde institucional
        
            // Genera el documento PDF usando el contenedor de QuestPDF
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape()); // Cambiado a Horizontal (Landscape) para que entren cómodas las 7 columnas
                    page.Margin(1.0f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Arial"));
        
                    // --- CABECERA DEL DOCUMENTO ---
                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(column =>
                        {
                            column.Item().Text("REPORTE DE INVENTARIO").FontSize(20).ExtraBold().FontColor(primaryColor);
                            column.Item().Text($"Fecha de Emisión: {fechaEmision:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Black);
                            column.Item().Text("Todo tu stock en orden.").FontSize(9).FontColor(Colors.Grey.Medium);
                        });
        
                        row.ConstantItem(100).AlignRight().AlignMiddle().Column(col =>
                        {
                            col.Item().Border(1).BorderColor(primaryColor).Padding(5).AlignCenter().Text("Stockio").Bold().FontColor(primaryColor);
                        });
                    });
        
                    // --- CONTENIDO PRINCIPAL (TABLA) ---
                    page.Content().PaddingVertical(1, Unit.Centimetre).Column(column =>
                    {
                        // Tabla de Productos
                        column.Item().Table(table =>
                        {
                            // Definición de Columnas (7 columnas en total adaptadas a formato horizontal)
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(100); // Código de Barras
                                columns.RelativeColumn(2.5f); // Nombre del Producto
                                columns.RelativeColumn(1.5f); // Categoría
                                columns.RelativeColumn(1.5f); // Proveedor
                                columns.RelativeColumn(1f);   // Precio
                                columns.RelativeColumn(0.8f); // Stock
                                columns.RelativeColumn(1.2f); // Subtotal
                            });
        
                            // Cabecera de la Tabla
                            table.Header(header =>
                            {
                                header.Cell().Background(primaryColor).Padding(5).Text("Código de Barras").Bold().FontColor(Colors.White);
                                header.Cell().Background(primaryColor).Padding(5).Text("Producto").Bold().FontColor(Colors.White);
                                header.Cell().Background(primaryColor).Padding(5).Text("Categoría").Bold().FontColor(Colors.White);
                                header.Cell().Background(primaryColor).Padding(5).Text("Proveedor").Bold().FontColor(Colors.White);
                                header.Cell().Background(primaryColor).Padding(5).AlignRight().Text("Precio").Bold().FontColor(Colors.White);
                                header.Cell().Background(primaryColor).Padding(5).AlignRight().Text("Stock").Bold().FontColor(Colors.White);
                                header.Cell().Background(primaryColor).Padding(5).AlignRight().Text("Subtotal").Bold().FontColor(Colors.White);
                            });
        
                            // Filas de la Tabla
                            foreach (var prod in products)
                            {
                                decimal subtotal = prod.Price * prod.Stock;
                                string proveedorNombre = prod.Provider?.Name ?? "Sin Proveedor";
        
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(prod.Barcode ?? "S/N");
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(prod.Name);
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(prod.Categoria.ToString());
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(proveedorNombre);
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"${prod.Price:N2}");
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"{prod.Stock:N0}");
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"${subtotal:N2}");
                            }
                        });
        
                        column.Item().PaddingTop(20).AlignRight().Width(220).BorderTop(1).BorderColor(primaryColor).PaddingTop(5).Column(totalCol =>
                        {
                            totalCol.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Total Unidades:").Bold();
                                r.ConstantItem(90).AlignRight().Text($"{totalItems:N0}");
                            });
                            totalCol.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Valor del Inventario:").Bold().FontColor(primaryColor);
                                r.ConstantItem(90).AlignRight().Text($"${valorTotalInventario:N2}").Bold().FontColor(primaryColor);
                            });
                        });
                    });
        
                    // --- PIE DE PÁGINA ---
                    page.Footer().Row(row =>
                    {
                        row.RelativeItem().Text("Documento confidencial generado de forma automatizada por el sistema de control de stock.")
                            .FontSize(8)
                            .FontColor(Colors.Grey.Medium);
        
                        row.RelativeItem().AlignRight().Text(text =>
                        {
                            text.Span("Página ").FontSize(8).FontColor(Colors.Grey.Medium);
                            text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                            text.Span(" de ").FontSize(8).FontColor(Colors.Grey.Medium);
                            text.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                        });
                    });
                });
            });
        
            // Se compila "document" y lo pasa a byte[]
            using (var stream = new MemoryStream())
            {
                document.GeneratePdf(stream);
                return stream.ToArray();
            }
        }
    }
}  
