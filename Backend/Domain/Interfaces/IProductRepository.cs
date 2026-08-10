using Domain.Entities;
using Domain.Enums;

namespace Domain.Interfaces;

// Hereda de IGenericRepository, por lo que ya tiene incorporado Add, Update, Delete, etc.
public interface IProductRepository : IGenericRepository<Product>
{
    Task<IEnumerable<Product>> SearchByBarcodeOrNameAsync(string? query, Guid tenantId, Guid? providerId = null, string? period = null, bool isCriticalStock = false,ProductCategory? categoria = null);
    Task<Product?> GetByBarcodeAndTenantAsync(string barcode, Guid tenantId);
    Task<IEnumerable<Product>> GetProductsWithProviderAsync(Guid tenantId);
    //crea el mismo getById con otra implementacion
    new Task<Product?> GetByIdAsync(Guid id);
}