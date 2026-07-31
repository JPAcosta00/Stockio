using Domain.Entities;
using Domain.Interfaces;
using Application.DTOs;
using Application.Interfaces;
using FluentValidation;

namespace Application.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly IValidator<Product> _validator;
    public ProductService(IProductRepository productRepository, IValidator<Product> validator){
        _productRepository = productRepository;
        _validator = validator;
    }

    public async Task<IEnumerable<ProductResponseDto>> GetProductsByTenantAsync(Guid tenantId)
    {
        // Se buscan todos los productos del tenant
        var products = await _productRepository.GetAllAsync(p => p.TenantId == tenantId && p.IsActive);
        
        //se mapea los productos al DTO
        return products.Select(p => new ProductResponseDto
        {
            Id = p.Id,
            Barcode = p.Barcode,
            Name = p.Name,
            Description = p.Description,
            Price = p.Price,
            Stock = p.Stock,
            MinimumStock = p.MinimumStock,
            IsActive = p.IsActive
        });
    }

    public async Task<ProductResponseDto?> GetProductByBarcodeAsync(string barcode, Guid tenantId){
        var p = await _productRepository.GetByBarcodeAsync(barcode);
        if (p == null) return null;

        return new ProductResponseDto
        {
            Id = p.Id,
            Barcode = p.Barcode,
            Name = p.Name,
            Description = p.Description,
            Price = p.Price,
            Stock = p.Stock,
            MinimumStock = p.MinimumStock,
            IsActive = p.IsActive
        };
    }

    public async Task<IEnumerable<Product>> GetFilteredProductsAsync(ProductReportFilterDto filter, Guid tenantId){
        //busca todos los productos del usuario actual
        var products = await _productRepository.GetAllAsync(p => p.TenantId == tenantId && p.IsActive);
    
        // Si la lista está vacía, se retorna directamente 
        if (products == null) return Enumerable.Empty<Product>();

        var listaLimpia = products.Where(p => p.IsActive && p.TenantId == tenantId);

        // filtro de Nombre 
        if (!string.IsNullOrWhiteSpace(filter.Name)){
            products = products.Where(p => p.Name != null && 
                                       p.Name.Contains(filter.Name, StringComparison.OrdinalIgnoreCase));
        }

        // filtro de Período
        if (!string.IsNullOrWhiteSpace(filter.Period)){
            var fechaLimite = DateTime.UtcNow;

            switch (filter.Period.ToLower()){
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
    public async Task<ProductResponseDto> CreateProductAsync(ProductCreateDto dto){
        //valida que el codigo de barras no exista
        var existenProductos = await _productRepository.GetAllAsync(p => p.Barcode == dto.Barcode);

        if (existenProductos.Any())
        {
            var failures = new List<FluentValidation.Results.ValidationFailure>
            {
                new FluentValidation.Results.ValidationFailure("Barcode", "El código de barras ya se encuentra registrado.")
            };

            throw new ValidationException(failures);
        }

        var newProduct = new Product
        {
            Barcode = dto.Barcode,
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            MinimumStock = dto.MinimumStock,
        };
        var validationResult = await _validator.ValidateAsync(newProduct);
        if (!validationResult.IsValid) {
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
            IsActive = newProduct.IsActive
        };
    }
    public async Task<bool> DeleteProductAsync(Guid id){
        // El repositorio lo busca (EF Core lo filtra por Tenant automáticamente)
         var product = await _productRepository.GetByIdAsync(id); 
    
        if (product == null) return false;

        // Baja lógica: no se borra, se desactiva
        product.IsActive = false;

        await _productRepository.SaveChangesAsync();
        return true;
    }
    public async Task UpdateProductAsync(Guid productId, UpdateProductDto dto){
        //se busca el producto y se modifica 
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
            throw new KeyNotFoundException("El producto especificado no existe o no tenés permisos para verlo.");

        product.UpdateDetails(dto.Name, dto.Barcode, dto.Price, dto.StockActual, dto.StockMinimum, dto.Description, dto.State);

        await _productRepository.SaveChangesAsync();
    }
}