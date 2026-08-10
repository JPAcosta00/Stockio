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
    
        var rows = usedRange.RowsUsed().Skip(1);
    
        foreach (var row in rows)
        {
            string barcode = row.Cell(1).GetValue<string>().Trim();
            string name = row.Cell(2).GetValue<string>().Trim();
            string description = row.Cell(3).GetValue<string>().Trim();
            decimal price = row.Cell(4).GetValue<decimal>();
            int stock = row.Cell(5).GetValue<int>();
            int minimumStock = row.Cell(6).GetValue<int>();
            
            // Leemos la celda 7 para la categoría (asumiendo que está ahí)
            string categoriaStr = row.Cell(7).GetValue<string>().Trim();
    
            ProductCategory categoriaFinal;
            bool missingCategory = false;
    
            // Intentamos parsear el texto del Excel al Enum de C#
            if (Enum.TryParse<ProductCategory>(categoriaStr, true, out var parsedCategory))
            {
                categoriaFinal = parsedCategory;
            }
            else
            {
                // Si viene vacía o no coincide con ninguna del Enum, por defecto ponemos "Otros" y marcamos faltante
                categoriaFinal = ProductCategory.Otros;
                missingCategory = true; 
            }
    
            // Verificamos si ya existe en la base de datos para este tenant
            var existingProduct = await _productRepository.GetByBarcodeAndTenantAsync(barcode, tenantId);
    
            previewList.Add(new ProductPreviewDto
            {
                Barcode = barcode,
                Name = name,
                Description = description,
                Price = price,
                Stock = stock,
                MinimumStock = minimumStock,
                Categoria = categoriaFinal,           // <--- Asignamos la categoría resuelta
                MissingCategoryInExcel = missingCategory, // <--- Bandera para el frontend
                IsExisting = existingProduct != null,
                UpdatedAt = existingProduct?.UpdatedAt
            });
        }
    
        return previewList;
    }

    // 2. Método de importación final (Guarda en base de datos - tu lógica actual intacta)
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

        var rows = usedRange.RowsUsed().Skip(1); 
        int currentRowIndex = 1;

        foreach (var row in rows){
            currentRowIndex++;
            result.TotalRows++;

            string barcode = row.Cell(1).GetValue<string>().Trim();
            string name = row.Cell(2).GetValue<string>().Trim();
            string description = row.Cell(3).GetValue<string>().Trim();
            decimal price = row.Cell(4).GetValue<decimal>();
            int stock = row.Cell(5).GetValue<int>();
            int minimumStock = row.Cell(6).GetValue<int>();

            // si viene sin categoria, se le asigna "otros"
            string categoriaStr = row.Cell(7).GetValue<string>().Trim();
            ProductCategory categoriaFinal = Enum.TryParse<ProductCategory>(categoriaStr, true, out var parsedCategory) 
                ? parsedCategory 
                : ProductCategory.Otros;

            // Verificamos si el producto ya existe para este Tenant
            var existingProduct = await _productRepository.GetByBarcodeAndTenantAsync(barcode, tenantId);

            if (existingProduct != null)
            {
                if (updateExisting)
                {
                    // Actualizamos los datos del producto existente, incluyendo la categoría
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
                    // Si decidió no actualizar, se omite
                    result.SuccessfulRows++; 
                }
                continue;
            }

            // Si no existe, creamos uno nuevo asignándole su TenantId y su Categoría
            var product = new Product
            {
                TenantId = tenantId,
                Barcode = barcode,
                Name = name,
                Description = description,
                Price = price,
                Stock = stock,
                MinimumStock = minimumStock,
                Categoria = categoriaFinal, // <--- Asignamos la categoría
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