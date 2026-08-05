using Domain.Entities;
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
    // Busca por código de barras O por nombre filtrando estrictamente por TenantId
    public async Task<IEnumerable<Product>> SearchByBarcodeOrNameAsync(string query, Guid tenantId)
    {
        var cleanQuery = query.Trim().ToLower();

        return await _context.Products
            .Where(p => p.TenantId == tenantId 
                     && p.IsActive 
                     && (p.Barcode.ToLower() == cleanQuery || p.Name.ToLower().Contains(cleanQuery)))
            .ToListAsync();
    }

    public async new Task<Product?> GetByIdAsync(Guid id){
        return await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
    }
}