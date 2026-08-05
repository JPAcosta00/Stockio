using Domain.Entities;

namespace Domain.Interfaces;

public interface IUserRepository : IGenericRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    
    Task<User?> GetByIdIgnoreTenantAsync(Guid id);

    Task<User?> GetByResetTokenAsync(string token);
}