using Application.DTOs;
using Application.Interfaces;
using ClosedXML.Excel;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Text.RegularExpressions;

namespace Application.Services;

public class ProductImportService : IProductImportService
{
    private readonly IProductRepository _productRepository;

    public ProductImportService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    // --- MÉTODOS AUXILIARES ---

    private Dictionary<string, int> GetColumnMappings(IXLRangeRow headerRow)
    {
        var mappings = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in headerRow.Cells())
        {
            var rawHeader = cell.GetValue<string>();
            if (string.IsNullOrWhiteSpace(rawHeader)) continue;

            // Normalizamos el encabezado: minúsculas, sin espacios, sin acentos, sin guiones ni barras
            var normalizedHeader = Regex.Replace(rawHeader.ToLowerInvariant(), @"[\s/\-_.]", "");

            if (!mappings.ContainsKey(normalizedHeader))
            {
                mappings[normalizedHeader] = cell.Address.ColumnNumber;
            }
        }
        return mappings;
    }

    private ProductCategory ParseCategory(string categoriaStr)
    {
        if (string.IsNullOrWhiteSpace(categoriaStr)) return ProductCategory.Otros;

        // Limpieza: elimina barras y espacios para coincidir con tu Enum (ej: "Grano/Cereal" -> "GranoCereal")
        string categoriaSanitized = categoriaStr.Replace("/", "").Replace(" ", "");

        if (Enum.TryParse<ProductCategory>(categoriaSanitized, true, out var parsedCategory) ||
            Enum.TryParse<ProductCategory>(categoriaStr, true, out parsedCategory))
        {
            return parsedCategory;
        }

        return ProductCategory.Otros;
    }

    // --- 1. PREVISUALIZACIÓN (Leer Excel) ---
    public async Task<IEnumerable<ProductPreviewDto>> PreviewExcelAsync(IFormFile file, Guid tenantId)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("El archivo de Excel es inválido.");

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.First();
        
        var usedRange = worksheet.RangeUsed();
        if (usedRange == null) return new List<ProductPreviewDto>();

        var header = usedRange.FirstRow();
        var mappings = GetColumnMappings(header);
        var rows = usedRange.RowsUsed().Skip(1);

        var list = new List<ProductPreviewDto>();

        foreach (var row in rows)
        {
            // Búsqueda flexible de columnas con normalización
            string bc = mappings.ContainsKey("barcode") ? row.Cell(mappings["barcode"]).GetFormattedString().Trim() : 
                        mappings.ContainsKey("codigo") ? row.Cell(mappings["codigo"]).GetFormattedString().Trim() : "";
            
            string name = mappings.ContainsKey("name") ? row.Cell(mappings["name"]).GetValue<string>() :
                          mappings.ContainsKey("nombredelproducto") ? row.Cell(mappings["nombredelproducto"]).GetValue<string>() :
                          mappings.ContainsKey("nombre") ? row.Cell(mappings["nombre"]).GetValue<string>() : "Sin nombre";

            string description = mappings.ContainsKey("description") ? row.Cell(mappings["description"]).GetValue<string>() :
                                 mappings.ContainsKey("descripcion") ? row.Cell(mappings["descripcion"]).GetValue<string>() : "";

            decimal price = mappings.ContainsKey("price") ? row.Cell(mappings["price"]).GetValue<decimal>() :
                            mappings.ContainsKey("precio") ? row.Cell(mappings["precio"]).GetValue<decimal>() : 0;

            int stock = mappings.ContainsKey("stock") ? row.Cell(mappings["stock"]).GetValue<int>() : 0;

            int minStock = mappings.ContainsKey("minimumstock") ? row.Cell(mappings["minimumstock"]).GetValue<int>() :
                           mappings.ContainsKey("stockminimo") ? row.Cell(mappings["stockminimo"]).GetValue<int>() :
                           mappings.ContainsKey("stockmin") ? row.Cell(mappings["stockmin"]).GetValue<int>() : 0;

            string categoriaStr = mappings.ContainsKey("categoria") ? row.Cell(mappings["categoria"]).GetValue<string>() :
                                  mappings.ContainsKey("category") ? row.Cell(mappings["category"]).GetValue<string>() : "Otros";

            // Verificar si el producto ya existe en la DB
            var existing = !string.IsNullOrEmpty(bc) 
                ? await _productRepository.GetByBarcodeAndTenantAsync(bc, tenantId) 
                : null;

            list.Add(new ProductPreviewDto
            {
                Barcode = bc,
                Name = name,
                Description = description,
                Price = price,
                Stock = stock,
                MinimumStock = minStock,
                Categoria = ParseCategory(categoriaStr).ToString(),
                IsExisting = existing != null
            });
        }
        return list;
    }

    // --- 2. IMPORTACIÓN FINAL (Guardar desde JSON editado) ---
    public async Task<int> ImportFromListAsync(List<ProductImportDto> productos, bool updateExisting, Guid tenantId)
    {
        int count = 0;
        foreach (var dto in productos)
        {
            var p = !string.IsNullOrEmpty(dto.Barcode) 
                ? await _productRepository.GetByBarcodeAndTenantAsync(dto.Barcode, tenantId) 
                : null;
            
            ProductCategory cat = ParseCategory(dto.Categoria);

            if (p != null)
            {
                if (!updateExisting) continue;
                
                p.Name = dto.Name;
                p.Description = dto.Description ?? "";
                p.Price = dto.PrecioFinal;
                p.Stock = dto.NuevoStock;
                p.MinimumStock = dto.NuevoStockMin;
                p.Categoria = cat;
                p.UpdatedAt = DateTime.Now;
                
                _productRepository.Update(p);
            }
            else
            {
                var nuevo = new Product {
                    TenantId = tenantId,
                    Barcode = dto.Barcode ?? Guid.NewGuid().ToString().Substring(0, 8), // Generar si falta
                    Name = dto.Name,
                    Description = dto.Description ?? "",
                    Price = dto.PrecioFinal,
                    Stock = dto.NuevoStock,
                    MinimumStock = dto.NuevoStockMin,
                    Categoria = cat,
                    IsActive = true
                };
                await _productRepository.AddAsync(nuevo);
            }
            count++;
        }
        
        await _productRepository.SaveChangesAsync();
        return count;
    }
}