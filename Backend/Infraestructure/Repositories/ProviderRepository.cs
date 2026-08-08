using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Interfaces;
using Infraestructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class ProviderRepository : GenericRepository<Provider>, IProviderRepository
    {
        public ProviderRepository(ApplicationDbContext context) : base(context)
        {
        }


        public async Task<IEnumerable<Provider>> GetAllAsync(Guid tenantId)
        {
            // Reutiliza el GetAllAsync del GenericRepository pasando el predicado del tenant
            return await base.GetAllAsync(p => p.TenantId == tenantId);
        }

        public async Task<Provider?> GetByIdAsync(Guid id, Guid tenantId)
        {
            var provider = await base.GetByIdAsync(id);
            
            // Validamos que pertenezca al tenant por seguridad
            if (provider == null || provider.TenantId != tenantId)
                return null;

            return provider;
        }

    }
}