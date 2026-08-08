using Domain.Entities;
using Domain.Interfaces;

namespace Domain.Interfaces;

public interface IPurchaseInvoiceRepository : IGenericRepository<PurchaseInvoice>
{
    // Acá podés agregar métodos específicos para facturas si los necesitás en el futuro,
    // por ejemplo: Task<IEnumerable<PurchaseInvoice>> GetByProviderAsync(Guid providerId, Guid tenantId);
}