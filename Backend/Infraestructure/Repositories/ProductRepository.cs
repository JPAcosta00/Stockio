using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Infraestructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

// Hereda la lógica de GenericRepository e implementa el contrato específico IProductRepository
public class ProductRepository : GenericRepository<Product>, IProductRepository
{
    public ProductRepository(ApplicationDbContext context) : base(context)
    {
    }
    public async Task<IEnumerable<Product>> SearchByBarcodeOrNameAsync(string? query, Guid tenantId, Guid? providerId = null, string? period = null, bool isCriticalStock = false,ProductCategory? categoria = null) 
    {
        var cleanQuery = query?.Trim().ToLower() ?? string.Empty;
    
        var dbQuery = _context.Products
            .Include(p => p.Provider)
            .Where(p => p.TenantId == tenantId && p.IsActive);
    
        // 1. Filtro por texto (Nombre o Código)
        if (!string.IsNullOrEmpty(cleanQuery))
        {
            dbQuery = dbQuery.Where(p => 
                (p.Barcode != null && p.Barcode.ToLower() == cleanQuery) || 
                (p.Name != null && p.Name.ToLower().Contains(cleanQuery))
            );
        }
    
        // 2. Filtro por Proveedor
        if (providerId.HasValue && providerId.Value != Guid.Empty)
        {
            dbQuery = dbQuery.Where(p => p.ProviderId == providerId.Value);
        }
    
        // 3. Filtro por Categoría <--- NUEVO BLOQUE
        if (categoria.HasValue)
        {
            dbQuery = dbQuery.Where(p => p.Categoria == categoria.Value);
        }
    
        // 4. Filtro por Stock Crítico (Stock menor o igual al mínimo)
        if (isCriticalStock)
        {
            dbQuery = dbQuery.Where(p => p.Stock <= p.MinimumStock);
        }
    
        // 5. Filtro por Período usando UpdatedAt
        if (!string.IsNullOrEmpty(period))
        {
            var hoy = DateTime.UtcNow.Date;
    
            if (period == "hoy")
            {
                dbQuery = dbQuery.Where(p => p.UpdatedAt.Date == hoy);
            }
            else if (period == "semana")
            {
                var inicioSemana = hoy.AddDays(-(int)hoy.DayOfWeek);
                dbQuery = dbQuery.Where(p => p.UpdatedAt.Date >= inicioSemana);
            }
            else if (period == "mes")
            {
                dbQuery = dbQuery.Where(p => p.UpdatedAt.Year == hoy.Year && p.UpdatedAt.Month == hoy.Month);
            }
            else if (period == "anio")
            {
                dbQuery = dbQuery.Where(p => p.UpdatedAt.Year == hoy.Year);
            }
        }
    
        return await dbQuery.ToListAsync();
    }
    public async Task<Product?> GetByBarcodeAndTenantAsync(string barcode, Guid tenantId)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.Barcode == barcode && p.TenantId == tenantId);
    }
    public async Task<IEnumerable<Product>> GetProductsWithProviderAsync(Guid tenantId)
    {
        return await _context.Products
            .Where(p => p.TenantId == tenantId && p.IsActive)
            .Include(p => p.Provider) // <--- ¡Aquí está la magia de EF Core!
            .ToListAsync();
    }
    public async new Task<Product?> GetByIdAsync(Guid id){
        return await _context.Products.Include(p => p.Provider).FirstOrDefaultAsync(p => p.Id == id);
    }
}