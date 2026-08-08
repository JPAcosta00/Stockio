using Application.DTOs; 

namespace Application.Interfaces;
public interface IPurchaseInvoiceService
{
    Task<IEnumerable<PurchaseInvoiceDto>> GetAllAsync(Guid tenantId);
    Task<PurchaseInvoiceDto> CreateAsync(CreatePurchaseInvoiceDto dto, Guid tenantId);
    Task MarkAsPaidAsync(Guid id, Guid tenantId);
}