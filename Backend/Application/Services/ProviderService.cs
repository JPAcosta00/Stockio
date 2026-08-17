using System;
using System.Collections.Generic;
using System.Linq; // <-- ¡Este era el que faltaba para usar .Any()!
using System.Threading.Tasks;
using Domain.Entities;
using Domain.Interfaces;
using Application.Interfaces;

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
            // 1. Obtener todos los proveedores actuales del tenant
            var existingProviders = await _providerRepository.GetAllAsync(tenantId);

            // 2. Verificar duplicados (Validando que el teléfono no se repita)
            // Nota: Agregamos una verificación para asegurarnos de que el teléfono no sea nulo o vacío si permites varios vacíos.
            bool phoneExists = !string.IsNullOrWhiteSpace(provider.Phone) && 
                               existingProviders.Any(p => p.Phone == provider.Phone);

            bool nameExists = existingProviders.Any(p => 
                               p.Name.Equals(provider.Name, StringComparison.OrdinalIgnoreCase));

            if (phoneExists)
            {
                throw new InvalidOperationException("Ya existe un proveedor registrado con ese mismo número de teléfono.");
            }

            if (nameExists)
            {
                throw new InvalidOperationException("Ya existe un proveedor registrado con ese mismo nombre.");
            }

            // 3. Si pasa las validaciones, continúa con la creación
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

            // Opcional: Podrías agregar validación de teléfono duplicado también aquí al actualizar,
            // asegurándote de que el teléfono pertenezca al mismo proveedor o no esté en uso por otro.

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