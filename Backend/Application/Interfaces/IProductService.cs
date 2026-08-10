using Application.DTOs;
using Domain.Entities;

namespace Application.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductResponseDto>> SearchProductsAsync(string? query, Guid tenantId, Guid? providerId = null, string? period = null, bool isCriticalStock = false);
    Task<IEnumerable<ProductResponseDto>> GetProductsByTenantAsync(Guid tenantId);
    Task<IEnumerable<Product>> GetFilteredProductsAsync(ProductReportFilterDto filter, Guid tenantId);
    Task<ProductResponseDto> CreateProductAsync(ProductCreateDto dto, Guid tenantId);
    Task<bool> DeleteProductAsync(Guid id, Guid tenantId);
    Task UpdateProductAsync(Guid productId, UpdateProductDto dto);
}