using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Interfaces;
using Application.Interfaces; // Asegurate de importar la interfaz del servicio

namespace Application.Services
{
    public class ProviderService : IProviderService
    {
        private readonly IProviderRepository _providerRepository;

        public ProviderService(IProviderRepository providerRepository)
        {
            _providerRepository = providerRepository;
        }

        public async Task<IEnumerable<Provider>> GetProvidersAsync(Guid tenantId)
        {
            return await _providerRepository.GetAllAsync(tenantId);
        }

        public async Task<Provider?> GetProviderByIdAsync(Guid id, Guid tenantId)
        {
            return await _providerRepository.GetByIdAsync(id, tenantId);
        }

        public async Task CreateProviderAsync(Provider provider, Guid tenantId)
        {
            // 1. Obtener todos los proveedores actuales del tenant para validar duplicados
            var existingProviders = await _providerRepository.GetAllAsync(tenantId);

            // 2. Verificar si ya existe uno con el mismo nombre y teléfono (o puedes ajustar la regla si es O / AND)
            bool providerExists = existingProviders.Any(p => 
                p.Name.Equals(provider.Name, StringComparison.OrdinalIgnoreCase) || 
                p.Phone == provider.Phone);

            if (providerExists)
            {
                throw new InvalidOperationException("Ya existe un proveedor registrado con ese mismo nombre y número de teléfono.");
            }

            // 3. Si no existe, continúa con la creación normal
            provider.Id = Guid.NewGuid();
            provider.TenantId = tenantId;
            provider.CreatedAt = DateTime.UtcNow;
            
            await _providerRepository.AddAsync(provider);
            await _providerRepository.SaveChangesAsync();
        }

        public async Task UpdateProviderAsync(Provider provider, Guid tenantId)
        {
            var existing = await _providerRepository.GetByIdAsync(provider.Id, tenantId);
            if (existing == null)
                throw new Exception("Proveedor no encontrado");

            existing.Name = provider.Name;
            existing.ContactName = provider.ContactName;
            existing.Phone = provider.Phone;
            existing.Cuit = provider.Cuit;
            existing.AccountBalance = provider.AccountBalance;

            _providerRepository.Update(existing);
            await _providerRepository.SaveChangesAsync();
        }

        public async Task DeleteProviderAsync(Guid id, Guid tenantId)
        {
            var provider = await _providerRepository.GetByIdAsync(id, tenantId);
            if (provider == null)
                throw new Exception("Proveedor no encontrado");

            _providerRepository.Delete(provider);
            await _providerRepository.SaveChangesAsync();
        }
    }
}