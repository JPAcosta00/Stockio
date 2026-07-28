using System;
using System.Threading.Tasks;
using Application.DTOs;

namespace Application.Interfaces
{
    public interface ISaleService
    {
        Task<Guid> CreateSaleAsync(Guid tenantId, CreateSaleDto dto);

        Task<IEnumerable<SaleHistoryDto>> GetSalesHistoryAsync(Guid tenantId);

        Task<SaleResponseDto?> GetSaleByIdAsync(Guid tenantId, Guid saleId);
    }
}