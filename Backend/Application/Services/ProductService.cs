using Domain.Entities;
using Domain.Interfaces;
using Application.DTOs;
using Application.Interfaces;
using FluentValidation;
using Domain.Enums;

namespace Application.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly IValidator<Product> _validator;

    public ProductService(IProductRepository productRepository, IValidator<Product> validator)
    {
        _productRepository = productRepository;
        _validator = validator;
    }

    // Búsqueda unificada por código de barras o nombre filtrada por tenantId, proveedor, período, stock y categoría
    public async Task<IEnumerable<ProductResponseDto>> SearchProductsAsync(
        string? query, 
        Guid tenantId, 
        Guid? providerId = null, 
        string? period = null, 
        bool isCriticalStock = false, 
        string? categoriaStr = null)
    {
        ProductCategory? categoriaEnum = null;

        if (!string.IsNullOrWhiteSpace(categoriaStr) && Enum.TryParse<ProductCategory>(categoriaStr, true, out var parsedCategory))
        {
            categoriaEnum = parsedCategory;
        }

        // Le pasamos el ENUM parseado al repositorio (NO el string crudo)
        var products = await _productRepository.SearchByBarcodeOrNameAsync(
            query, tenantId, providerId, period, isCriticalStock, categoriaEnum
        );

        return products.Select(p => new ProductResponseDto
        {
            Id = p.Id,
            Barcode = p.Barcode,
            Name = p.Name,
            Description = p.Description,
            Price = p.Price,
            Stock = p.Stock,
            MinimumStock = p.MinimumStock,
            ProviderId = p.ProviderId,
            IsActive = p.IsActive,
            ProviderName = p.Provider?.Name,
            Categoria = p.Categoria,
            UpdatedAt = p.UpdatedAt
        });
    }
    public async Task<IEnumerable<ProductResponseDto>> GetProductsByTenantAsync(Guid tenantId)
    {
        var products = await _productRepository.GetProductsWithProviderAsync(tenantId);

        return products.Select(p => new ProductResponseDto
        {
            Id = p.Id,
            Barcode = p.Barcode,
            Name = p.Name,
            Description = p.Description,
            Price = p.Price,
            Stock = p.Stock,
            MinimumStock = p.MinimumStock,
            ProviderId = p.ProviderId,
            IsActive = p.IsActive,
            ProviderName = p.Provider != null ? p.Provider.Name : null,
            Categoria = p.Categoria,
            UpdatedAt = p.UpdatedAt
        });
    }

    public async Task<IEnumerable<Product>> GetFilteredProductsAsync(ProductReportFilterDto filter, Guid tenantId)
    {
        var rawProducts = await _productRepository.GetAllAsync(p => p.TenantId == tenantId && p.IsActive);

        if (rawProducts == null) return Enumerable.Empty<Product>();

        var products = rawProducts.Where(p => p.IsActive && p.TenantId == tenantId);

        // Filtro de Nombre
        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            products = products.Where(p => p.Name != null &&
                                          p.Name.Contains(filter.Name, StringComparison.OrdinalIgnoreCase));
        }

        // Filtro por Stock Crítico
        if (filter.IsCriticalStock.GetValueOrDefault())
        {
            products = products.Where(p => p.Stock <= p.MinimumStock);
        }

        // Filtro por Categoría usando el Enum directamente
        if (filter.Category.HasValue)
        {
            products = products.Where(p => p.Categoria == filter.Category.Value);
        }

        // Filtro de Período
        if (!string.IsNullOrWhiteSpace(filter.Period))
        {
            var fechaLimite = DateTime.UtcNow;

            switch (filter.Period.ToLower())
            {
                case "hoy":
                    fechaLimite = DateTime.Today;
                    products = products.Where(p => p.UpdatedAt >= fechaLimite);
                    break;
                case "semana":
                    fechaLimite = DateTime.Today.AddDays(-7);
                    products = products.Where(p => p.UpdatedAt >= fechaLimite);
                    break;
                case "mes":
                    fechaLimite = DateTime.Today.AddMonths(-1);
                    products = products.Where(p => p.UpdatedAt >= fechaLimite);
                    break;
                case "anio":
                    fechaLimite = DateTime.Today.AddYears(-1);
                    products = products.Where(p => p.UpdatedAt >= fechaLimite);
                    break;
            }
        }

        return products.ToList();
    }

    public async Task<ProductResponseDto> CreateProductAsync(ProductCreateDto dto, Guid tenantId)
    {
        // Valida que el código de barras no exista dentro del mismo Tenant
        var existenProductos = await _productRepository.GetAllAsync(p => p.Barcode == dto.Barcode && p.TenantId == tenantId && p.IsActive);

        if (existenProductos.Any())
        {
            var failures = new List<FluentValidation.Results.ValidationFailure>
            {
                new FluentValidation.Results.ValidationFailure("Barcode", "El código de barras ya se encuentra registrado en tu inventario.")
            };

            throw new ValidationException(failures);
        }

        var now = DateTime.UtcNow;

        var newProduct = new Product
        {
            TenantId = tenantId,
            Barcode = dto.Barcode,
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            MinimumStock = dto.MinimumStock,
            ProviderId = dto.ProviderId,
            Categoria = dto.Categoria, 
            IsActive = true,
            UpdatedAt = now
        };

        var validationResult = await _validator.ValidateAsync(newProduct);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        await _productRepository.AddAsync(newProduct);
        await _productRepository.SaveChangesAsync();

        return new ProductResponseDto
        {
            Id = newProduct.Id,
            Barcode = newProduct.Barcode,
            Name = newProduct.Name,
            Description = newProduct.Description,
            Price = newProduct.Price,
            Stock = newProduct.Stock,
            MinimumStock = newProduct.MinimumStock,
            IsActive = newProduct.IsActive,
            ProviderId = newProduct.ProviderId,
            ProviderName = newProduct.Provider?.Name,
            Categoria = newProduct.Categoria,
            UpdatedAt = newProduct.UpdatedAt
        };
    }

    public async Task<bool> DeleteProductAsync(Guid id, Guid tenantId)
    {
        var product = await _productRepository.GetByIdAsync(id);
    
        // Validamos que exista Y que pertenezca al tenant del usuario actual
        if (product == null || product.TenantId != tenantId)
        {
            return false; 
        }
    
        // 1. Baja lógica
        product.IsActive = false;
    
        // 2. Liberar el barcode para poder reutilizarlo
        product.Barcode = $"{product.Barcode}_del_{product.Id.ToString().Substring(0, 8)}";
    
        // 3. Actualizamos y guardamos
        _productRepository.Update(product);
        await _productRepository.SaveChangesAsync();
        
        return true;
    }

    public async Task UpdateProductAsync(Guid productId, UpdateProductDto dto)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
            throw new KeyNotFoundException("El producto especificado no existe o no tenés permisos para verlo.");

        product.UpdateDetails(dto.Name, dto.Barcode, dto.Price, dto.StockActual, dto.StockMinimum, dto.Description, dto.State, dto.ProviderId, dto.Categoria);

        await _productRepository.SaveChangesAsync();
    }
}