using Domain.Entities;

namespace Application.Interfaces
{
    public interface ISaleRepository
    {
        Task AddAsync(Sale sale);
        void Update(Sale sale);
        Task SaveChangesAsync();
        Task<IEnumerable<Sale>> GetByTenantAsync(Guid tenantId);
        Task<Sale?> GetByIdWithDetailsAsync(Guid id, Guid tenantId);
        
        //para las estadisticas de cada usuario
        Task<IEnumerable<Sale>> GetSalesWithDetailsAsync(Guid tenantId, DateTime startDate);

        Task ExecuteInTransactionAsync(Func<Task> action);
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}