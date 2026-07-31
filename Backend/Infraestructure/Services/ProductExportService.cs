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
        public async Task<byte[]> GenerateExcelAsync(IEnumerable<Product> products){
            products ??= Enumerable.Empty<Product>();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Inventario General");

                    // -------------------------------------------------------------
                    // 1. CABECERAS
                    // -------------------------------------------------------------
                    worksheet.Cell(1, 1).Value = "Código de Barras";
                    worksheet.Cell(1, 2).Value = "Nombre";
                    worksheet.Cell(1, 3).Value = "Descripción";
                    worksheet.Cell(1, 4).Value = "Precio Unitario";
                    worksheet.Cell(1, 5).Value = "Stock Disponible";
                    worksheet.Cell(1, 6).Value = "Valor Total Stock";

                    // Estilo a las cabeceras
                    var headerRange = worksheet.Range("A1:F1");
                    headerRange.Style.Font.Bold = true;
                    headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#1F4E78");
                    headerRange.Style.Font.FontColor = XLColor.White;
                    headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                    // -------------------------------------------------------------
                    // 2. CARGA DE DATOS
                    // -------------------------------------------------------------
                    int startRow = 2;
                    int currentRow = startRow;

                    foreach (var prod in products)
                    {
                        worksheet.Cell(currentRow, 1).Value = prod.Barcode;
                        worksheet.Cell(currentRow, 2).Value = prod.Name;
                        worksheet.Cell(currentRow, 3).Value = prod.Description;
                        worksheet.Cell(currentRow, 4).Value = prod.Price;
                        worksheet.Cell(currentRow, 5).Value = prod.Stock;
            
                        // Fórmulas nativas de Excel por fila (Precio * Stock)
                        worksheet.Cell(currentRow, 6).FormulaA1 = $"=D{currentRow}*E{currentRow}";

                        // Formatos de celda
                        worksheet.Cell(currentRow, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                        worksheet.Cell(currentRow, 4).Style.NumberFormat.Format = "$#,##0.00";
                        worksheet.Cell(currentRow, 5).Style.NumberFormat.Format = "#,##0";
                        worksheet.Cell(currentRow, 6).Style.NumberFormat.Format = "$#,##0.00";

                        currentRow++;
                    }

                    int lastDataRow = currentRow - 1;

                    // -------------------------------------------------------------
                    // 3. FILA DE TOTALES Y RESUMEN (Solo si hay productos)
                    // -------------------------------------------------------------
                    if (products.Any())
                    {
                         // Fila de Totales Generales
                        worksheet.Cell(currentRow, 3).Value = "TOTALES / PROMEDIOS:";
                        worksheet.Cell(currentRow, 3).Style.Font.Bold = true;
                        worksheet.Cell(currentRow, 3).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                        // Promedio de Precio Unitario
                        worksheet.Cell(currentRow, 4).FormulaA1 = $"=AVERAGE(D{startRow}:D{lastDataRow})";
                        worksheet.Cell(currentRow, 4).Style.NumberFormat.Format = "$#,##0.00";

                        // Total Unidades en Stock
                        worksheet.Cell(currentRow, 5).FormulaA1 = $"=SUM(E{startRow}:E{lastDataRow})";
                        worksheet.Cell(currentRow, 5).Style.NumberFormat.Format = "#,##0";

                        // Valorización Total del Inventario
                        worksheet.Cell(currentRow, 6).FormulaA1 = $"=SUM(F{startRow}:F{lastDataRow})";
                        worksheet.Cell(currentRow, 6).Style.NumberFormat.Format = "$#,##0.00";

                        // Estilos para la fila de totales
                        var totalRange = worksheet.Range(currentRow, 1, currentRow, 6);
                        totalRange.Style.Font.Bold = true;
                        totalRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");
                        totalRange.Style.Border.TopBorder = XLBorderStyleValues.Thin;
                        totalRange.Style.Border.BottomBorder = XLBorderStyleValues.Double;

                        // -------------------------------------------------------------
                        // 4. TARJETAS DE RESUMEN EJECUTIVO (KPIs al pie)
                        // -------------------------------------------------------------
                        int summaryStartRow = currentRow + 3;

                        worksheet.Cell(summaryStartRow, 1).Value = "MÉTRICA DE INVENTARIO";
                        worksheet.Cell(summaryStartRow, 2).Value = "VALOR";
                        var kpiHeader = worksheet.Range(summaryStartRow, 1, summaryStartRow, 2);
                        kpiHeader.Style.Font.Bold = true;
                        kpiHeader.Style.Fill.BackgroundColor = XLColor.FromHtml("#2F5597");
                        kpiHeader.Style.Font.FontColor = XLColor.White;

                        // Total de Ítems / Variedad
                        worksheet.Cell(summaryStartRow + 1, 1).Value = "Cantidad de Productos Distintos:";
                        worksheet.Cell(summaryStartRow + 1, 2).FormulaA1 = $"=COUNTA(B{startRow}:B{lastDataRow})";
                        worksheet.Cell(summaryStartRow + 1, 2).Style.NumberFormat.Format = "#,##0";

                        // Total Físico Unidades
                        worksheet.Cell(summaryStartRow + 2, 1).Value = "Total Unidades Físicas:";
                        worksheet.Cell(summaryStartRow + 2, 2).FormulaA1 = $"=E{currentRow}"; // Apunta al SUM de stock
                        worksheet.Cell(summaryStartRow + 2, 2).Style.NumberFormat.Format = "#,##0";

                        // Valor Capitalizado Total
                        worksheet.Cell(summaryStartRow + 3, 1).Value = "Valorización Total del Stock:";
                        worksheet.Cell(summaryStartRow + 3, 2).FormulaA1 = $"=F{currentRow}"; // Apunta al SUM de total $
                        worksheet.Cell(summaryStartRow + 3, 2).Style.NumberFormat.Format = "$#,##0.00";
                        worksheet.Cell(summaryStartRow + 3, 2).Style.Font.Bold = true;

                        // Bordes a la tabla de KPIs
                        var kpiTable = worksheet.Range(summaryStartRow, 1, summaryStartRow + 3, 2);
                        kpiTable.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                        kpiTable.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                    }

                    // -------------------------------------------------------------
                    // 5. FORMATO FINAL Y AUTOFIT
                    // -------------------------------------------------------------
                     worksheet.Columns().AdjustToContents();

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        return stream.ToArray();
                    }
             }
        }

        public async Task<byte[]> GeneratePdfAsync(IEnumerable<Product> products){
            // Si la lista viene nula o vacía, asegura una lista vacía para evitar fallos
            products ??= Enumerable.Empty<Product>();

            // Calcular totales para el resumen del reporte
            decimal valorTotalInventario = products.Sum(p => p.Price * p.Stock);
            int totalItems = products.Sum(p => p.Stock);

            // Obtiene la hora de Argentina independientemente de si corre en Windows o Linux/Render
            var timeZone = TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows() ? "Argentina Standard Time" : "America/Argentina/Buenos_Aires");
            var fechaEmision = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);

            // Genera el documento PDF usando el contenedor de QuestPDF
            var document = Document.Create(container =>{
                container.Page(page =>{
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                // --- CABECERA DEL DOCUMENTO ---
                page.Header().Row(row =>{
                    row.RelativeItem().Column(column =>{
                        column.Item().Text("REPORTE DE INVENTARIO").FontSize(20).Bold().FontColor("#1F4E78");
                        column.Item().Text($"Fecha de Emisión: {fechaEmision:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Black);
                        column.Item().Text("Sistema de Stock y Ventas").FontSize(9).FontColor(Colors.Grey.Medium);
                    });

                row.ConstantItem(100).AlignRight().AlignMiddle().Column(col =>{
                    // Espacio para el logo del tenant
                    col.Item().Border(1).BorderColor("#1F4E78").Padding(5).AlignCenter().Text("SaaS Stock").Bold().FontColor("#1F4E78");
                    });
                });

            // --- CONTENIDO PRINCIPAL (TABLA) ---
            page.Content().PaddingVertical(1, Unit.Centimetre).Column(column =>{
                // Tabla de Productos
                column.Item().Table(table =>
                {
                    // Definición de Columnas 
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(120); // Código de Barras
                        columns.RelativeColumn(3);   // Nombre
                        columns.RelativeColumn(1);   // Precio
                        columns.RelativeColumn(1);   // Stock
                        columns.RelativeColumn(1.2f); // Total por Producto
                    });

                    // Cabecera de la Tabla
                    table.Header(header =>
                    {
                        header.Cell().Background("#1F4E78").Padding(5).Text("Código de Barras").Bold().FontColor(Colors.White);
                        header.Cell().Background("#1F4E78").Padding(5).Text("Producto").Bold().FontColor(Colors.White);
                        header.Cell().Background("#1F4E78").Padding(5).AlignRight().Text("Precio").Bold().FontColor(Colors.White);
                        header.Cell().Background("#1F4E78").Padding(5).AlignRight().Text("Stock").Bold().FontColor(Colors.White);
                        header.Cell().Background("#1F4E78").Padding(5).AlignRight().Text("Subtotal").Bold().FontColor(Colors.White);
                    });

                    // Filas de la Tabla
                    foreach (var prod in products)
                    {
                        decimal subtotal = prod.Price * prod.Stock;

                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(prod.Barcode ?? "S/N");
                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(prod.Name);
                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"${prod.Price:N2}");
                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"{prod.Stock:N0}");
                        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"${subtotal:N2}");
                    }
                });

                column.Item().PaddingTop(20).AlignRight().Width(200).BorderTop(1).BorderColor("#1F4E78").PaddingTop(5).Column(totalCol =>
                {
                    totalCol.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Total Unidades:").Bold();
                        r.ConstantItem(80).AlignRight().Text($"{totalItems:N0}");
                    });
                    totalCol.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Valor del Inventario:").Bold().FontColor("#1F4E78");
                        r.ConstantItem(80).AlignRight().Text($"${valorTotalInventario:N2}").Bold().FontColor("#1F4E78");
                    });
                });
            });

            // --- PIE DE PÁGINA  ---
            page.Footer().Row(row =>{
                // Columna izquierda
                row.RelativeItem().Text("Documento confidencial generado de forma automatizada por el sistema de control de stock.")
                    .FontSize(8)
                    .FontColor(Colors.Grey.Medium);

                // Columna derecha: Numeración dinámica (Página X de Y)
                row.RelativeItem().AlignRight().Text(text =>{
                    text.Span("Página ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    text.Span(" de ").FontSize(8).FontColor(Colors.Grey.Medium);
                    text.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        });
        }); //se cierra el documento

        // Se compila "document" y lo pasa a byte[]
        using (var stream = new MemoryStream()){
            document.GeneratePdf(stream);
            return stream.ToArray(); 
        }
    }   
    }
}  
