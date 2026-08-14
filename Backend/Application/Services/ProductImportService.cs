using Application.DTOs;
using Application.Interfaces;
using ClosedXML.Excel;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace Application.Services;

public class ProductImportService : IProductImportService
{
    private readonly IProductRepository _productRepository; 
    private readonly IValidator<Product> _productValidator;

    public ProductImportService(IProductRepository productRepository, IValidator<Product> productValidator)
    {
        _productRepository = productRepository;
        _productValidator = productValidator;
    }

    // Método auxiliar para mapear dinámicamente los nombres de las columnas a sus índices
    private Dictionary<string, int> GetColumnMappings(IXLRangeRow headerRow)
    {
        var mappings = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in headerRow.Cells())
        {
            var headerName = cell.GetValue<string>().Trim();
            if (!string.IsNullOrEmpty(headerName) && !mappings.ContainsKey(headerName))
            {
                mappings[headerName] = cell.Address.ColumnNumber;
            }
        }
        return mappings;
    }

    // Método auxiliar para parsear la categoría de forma segura
    private ProductCategory ParseCategory(string categoriaStr)
    {
        if (string.IsNullOrWhiteSpace(categoriaStr))
        {
            return ProductCategory.Otros;
        }

        string categoriaSanitized = categoriaStr.Replace("/", "").Replace(" ", "");

        if (Enum.TryParse<ProductCategory>(categoriaSanitized, true, out var parsedCategory) ||
            Enum.TryParse<ProductCategory>(categoriaStr, true, out parsedCategory))
        {
            return parsedCategory;
        }

        return ProductCategory.Otros;
    }

    // 1. Método exclusivo para la PREVISUALIZACIÓN (No guarda en base de datos)
    public async Task<IEnumerable<ProductPreviewDto>> PreviewExcelAsync(IFormFile file, Guid tenantId)
    {
        var previewList = new List<ProductPreviewDto>();
    
        if (file == null || file.Length == 0)
            throw new ArgumentException("El archivo de Excel está vacío o es inválido.");
    
        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.First();
    
        var usedRange = worksheet.RangeUsed();
        if (usedRange == null)
        {
            throw new ArgumentException("La planilla de Excel no contiene datos.");
        }
    
        // Obtenemos los encabezados de la primera fila para mapear las columnas
        var headerRow = usedRange.FirstRow();
        var mappings = GetColumnMappings(headerRow);

        var rows = usedRange.RowsUsed().Skip(1);
    
        foreach (var row in rows)
        {
            // Lectura dinámica e independiente del orden de columnas
            string barcode = mappings.ContainsKey("barcode") && !row.Cell(mappings["barcode"]).IsEmpty()
                ? row.Cell(mappings["barcode"]).GetFormattedString().Trim() 
                : string.Empty;

            string name = mappings.ContainsKey("name") && !row.Cell(mappings["name"]).IsEmpty()
                ? row.Cell(mappings["name"]).GetValue<string>().Trim() 
                : string.Empty;

            string description = mappings.ContainsKey("description") && !row.Cell(mappings["description"]).IsEmpty()
                ? row.Cell(mappings["description"]).GetValue<string>().Trim() 
                : string.Empty;

            decimal price = mappings.ContainsKey("price") && !row.Cell(mappings["price"]).IsEmpty() && decimal.TryParse(row.Cell(mappings["price"]).GetFormattedString(), out var parsedPrice)
                ? parsedPrice 
                : 0;

            int stock = mappings.ContainsKey("stock") && !row.Cell(mappings["stock"]).IsEmpty() && int.TryParse(row.Cell(mappings["stock"]).GetFormattedString(), out var parsedStock)
                ? parsedStock 
                : 0;

            int minimumStock = mappings.ContainsKey("minimumStock") && !row.Cell(mappings["minimumStock"]).IsEmpty() && int.TryParse(row.Cell(mappings["minimumStock"]).GetFormattedString(), out var parsedMinStock)
                ? parsedMinStock 
                : 0;

            // Lectura de categoría (con soporte para columna "categoria" o "category")
            string categoriaStr = string.Empty;
            if (mappings.ContainsKey("categoria") && !row.Cell(mappings["categoria"]).IsEmpty())
                categoriaStr = row.Cell(mappings["categoria"]).GetValue<string>().Trim();
            else if (mappings.ContainsKey("category") && !row.Cell(mappings["category"]).IsEmpty())
                categoriaStr = row.Cell(mappings["category"]).GetValue<string>().Trim();

            ProductCategory categoriaFinal = ParseCategory(categoriaStr);
            bool missingCategory = string.IsNullOrWhiteSpace(categoriaStr);

            var existingProduct = !string.IsNullOrEmpty(barcode) 
                ? await _productRepository.GetByBarcodeAndTenantAsync(barcode, tenantId) 
                : null;
    
            previewList.Add(new ProductPreviewDto
            {
                Barcode = barcode,
                Name = name,
                Description = description,
                Price = price,
                Stock = stock,
                MinimumStock = minimumStock,
                Categoria = categoriaFinal,          
                MissingCategoryInExcel = missingCategory, 
                IsExisting = existingProduct != null,
                UpdatedAt = existingProduct?.UpdatedAt
            });
        }
    
        return previewList;
    }

    // 2. Método de importación final (Guarda en base de datos)
    public async Task<ProductImportResultDto> ImportFromExcelAsync(IFormFile file, Guid tenantId, bool updateExisting)
    {
        var result = new ProductImportResultDto();
        var productsToInsert = new List<Product>();

        if (file == null || file.Length == 0)
            throw new ArgumentException("El archivo de Excel está vacío o es inválido.");

        using var stream = file.OpenReadStream();
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.First();

        var usedRange = worksheet.RangeUsed();
        if (usedRange == null){
            throw new ArgumentException("La planilla de Excel no contiene datos.");
        }

        // Mapeo dinámico de columnas
        var headerRow = usedRange.FirstRow();
        var mappings = GetColumnMappings(headerRow);

        var rows = usedRange.RowsUsed().Skip(1); 
        int currentRowIndex = 1;

        foreach (var row in rows){
            currentRowIndex++;
            result.TotalRows++;

            string barcode = mappings.ContainsKey("barcode") && !row.Cell(mappings["barcode"]).IsEmpty()
                ? row.Cell(mappings["barcode"]).GetFormattedString().Trim() 
                : string.Empty;

            string name = mappings.ContainsKey("name") && !row.Cell(mappings["name"]).IsEmpty()
                ? row.Cell(mappings["name"]).GetValue<string>().Trim() 
                : string.Empty;

            string description = mappings.ContainsKey("description") && !row.Cell(mappings["description"]).IsEmpty()
                ? row.Cell(mappings["description"]).GetValue<string>().Trim() 
                : string.Empty;

            decimal price = mappings.ContainsKey("price") && !row.Cell(mappings["price"]).IsEmpty() && decimal.TryParse(row.Cell(mappings["price"]).GetFormattedString(), out var parsedPrice)
                ? parsedPrice 
                : 0;

            int stock = mappings.ContainsKey("stock") && !row.Cell(mappings["stock"]).IsEmpty() && int.TryParse(row.Cell(mappings["stock"]).GetFormattedString(), out var parsedStock)
                ? parsedStock 
                : 0;

            int minimumStock = mappings.ContainsKey("minimumStock") && !row.Cell(mappings["minimumStock"]).IsEmpty() && int.TryParse(row.Cell(mappings["minimumStock"]).GetFormattedString(), out var parsedMinStock)
                ? parsedMinStock 
                : 0;

            string categoriaStr = string.Empty;
            if (mappings.ContainsKey("categoria") && !row.Cell(mappings["categoria"]).IsEmpty())
                categoriaStr = row.Cell(mappings["categoria"]).GetValue<string>().Trim();
            else if (mappings.ContainsKey("category") && !row.Cell(mappings["category"]).IsEmpty())
                categoriaStr = row.Cell(mappings["category"]).GetValue<string>().Trim();

            ProductCategory categoriaFinal = ParseCategory(categoriaStr);

            var existingProduct = !string.IsNullOrEmpty(barcode)
                ? await _productRepository.GetByBarcodeAndTenantAsync(barcode, tenantId)
                : null;

            if (existingProduct != null)
            {
                if (updateExisting)
                {
                    existingProduct.Name = name;
                    existingProduct.Description = description;
                    existingProduct.Price = price;
                    existingProduct.Stock = stock;
                    existingProduct.MinimumStock = minimumStock;
                    existingProduct.Categoria = categoriaFinal; 
                    existingProduct.UpdatedAt = DateTime.Now;

                    _productRepository.Update(existingProduct);
                    result.SuccessfulRows++;
                }
                else
                {
                    result.SuccessfulRows++; 
                }
                continue;
            }

            var product = new Product
            {
                TenantId = tenantId,
                Barcode = barcode,
                Name = name,
                Description = description,
                Price = price,
                Stock = stock,
                MinimumStock = minimumStock,
                Categoria = categoriaFinal,
                IsActive = true,
                UpdatedAt = DateTime.Now
            };

            var validationResult = await _productValidator.ValidateAsync(product);

            if (!validationResult.IsValid)
            {
                result.FailedRows++;
                result.Errors.Add(new RowErrorDto
                {
                    RowNumber = currentRowIndex,
                    Barcode = barcode,
                    ErrorMessage = string.Join(" | ", validationResult.Errors.Select(e => e.ErrorMessage))
                });
                continue; 
            }

            productsToInsert.Add(product);
            result.SuccessfulRows++;
        }

        if (productsToInsert.Any()){
            foreach (var product in productsToInsert) {
                await _productRepository.AddAsync(product); 
            }
        }

        await _productRepository.SaveChangesAsync();

        return result;
    }
}