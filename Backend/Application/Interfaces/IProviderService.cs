using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Domain.Entities;

namespace Application.Interfaces 
{
    public interface IProviderService
    {
        Task<IEnumerable<Provider>> GetProvidersAsync(Guid tenantId);
        Task<Provider?> GetProviderByIdAsync(Guid id, Guid tenantId);
        Task CreateProviderAsync(Provider provider, Guid tenantId);
        Task UpdateProviderAsync(Provider provider, Guid tenantId);
        Task DeleteProviderAsync(Guid id, Guid tenantId);
    }
}