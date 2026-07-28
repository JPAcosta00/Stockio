// Infrastructure/Repositories/SaleRepository.cs
using Application.Interfaces;
using Domain.Entities;
using Infraestructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class SaleRepository : ISaleRepository{
        private readonly ApplicationDbContext _context; 

        public SaleRepository(ApplicationDbContext context) => _context = context;

        public async Task AddAsync(Sale sale) => await _context.Set<Sale>().AddAsync(sale);
    
        public void Update(Sale sale) => _context.Set<Sale>().Update(sale);
    
        public async Task SaveChangesAsync() => await _context.SaveChangesAsync();

        // obtiene el historial filtrado por Tenant
        public async Task<IEnumerable<Sale>> GetByTenantAsync(Guid tenantId){
            return await _context.Set<Sale>()
                .Where(s => s.TenantId == tenantId)
                .OrderByDescending(s => s.CreatedAt) // Las más recientes primero
                .ToListAsync();
        }

        public async Task<IEnumerable<Sale>> GetSalesWithDetailsAsync(Guid tenantId, DateTime startDate){
            return await _context.Sales
                .Include(s => s.Details)
                    .ThenInclude(d => d.Product) 
                .Where(s => s.TenantId == tenantId && s.CreatedAt >= startDate)
                .ToListAsync();
        }

        // Obtiene una venta específica con sus productos para poder devolver el stock
        public async Task<Sale?> GetByIdWithDetailsAsync(Guid id, Guid tenantId){
            return await _context.Set<Sale>()
                .Include(s => s.Details) 
                .ThenInclude(d => d.Product)
                .FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);
        }

        public async Task BeginTransactionAsync() => await _context.Database.BeginTransactionAsync();
    
        public async Task CommitTransactionAsync() => await (_context.Database.CurrentTransaction?.CommitAsync() ?? Task.CompletedTask);
    
        public async Task RollbackTransactionAsync() => await (_context.Database.CurrentTransaction?.RollbackAsync() ?? Task.CompletedTask);
    }
}