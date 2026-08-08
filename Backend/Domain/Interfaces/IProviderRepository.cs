using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Domain.Entities;

public interface IProviderRepository
    {
        Task<IEnumerable<Provider>> GetAllAsync(Guid tenantId);
        Task<Provider?> GetByIdAsync(Guid id, Guid tenantId);
        Task AddAsync(Provider provider);
        void Update(Provider provider);
        void Delete(Provider provider);
        Task<bool> SaveChangesAsync();
    }