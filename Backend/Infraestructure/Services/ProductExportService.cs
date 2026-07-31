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
        public async Task<byte[]> GenerateExcelAsync(IEnumerable<Product> productIds){
            // EF filtra por tenant automaticamente
            IQueryable<Product> query = _context.Products;

            var products = await query.ToListAsync();

            // Crea el libro de Excel usando ClosedXML
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Inventario Seleccionado");

                //cabeceras
                worksheet.Cell(1, 1).Value = "Código de Barras";
                worksheet.Cell(1, 2).Value = "Nombre";
                worksheet.Cell(1, 3).Value = "Descripción";
                worksheet.Cell(1, 4).Value = "Precio";
                worksheet.Cell(1, 5).Value = "Stock Disponible";

                // Estilo a las cabeceras
                var headerRange = worksheet.Range("A1:E1");
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#1F4E78");
                headerRange.Style.Font.FontColor = XLColor.White;

                // Carga los datos
                int currentRow = 2;
                foreach (var prod in products)
                {
                    worksheet.Cell(currentRow, 1).Value = prod.Barcode;
                    worksheet.Cell(currentRow, 2).Value = prod.Name;
                    worksheet.Cell(currentRow, 3).Value = prod.Description;
                    worksheet.Cell(currentRow, 4).Value = prod.Price;
                    worksheet.Cell(currentRow, 5).Value = prod.Stock;

                    // Formato numérico y de moneda a las celdas
                    worksheet.Cell(currentRow, 4).Style.NumberFormat.Format = "$#,##0.00";
                    worksheet.Cell(currentRow, 5).Style.NumberFormat.Format = "#,##0";

                    currentRow++;
                }

                // Autoajustar el ancho de las columnas para que no se corte el texto
                worksheet.Columns().AdjustToContents();

                // Convertir el Excel a un array de bytes para el controlador
                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    return stream.ToArray();
                }
            }
        
        }
    
        public async Task<byte[]> GeneratePdfAsync(IEnumerable<Product> productIds){
            // obtiene los productos desde la bd
            IQueryable<Product> query = _context.Products;

            var products = await query.ToListAsync();
            //deberia validar si la lista esta vacia para avisar al usuario

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
                        column.Item().Text("Sistema de Stock y Ventas").FontSize(12).FontColor(Colors.Grey.Medium);
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
