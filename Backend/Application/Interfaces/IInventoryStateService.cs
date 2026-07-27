using Application.DTOs;

namespace Application.Interfaces;

public interface IInventoryStatsService
{
   Task<DashboardDataDto> GetStatsByInventoryFiltersAsync(Guid tenantId, ProductReportFilterDto filter);
    
   Task<byte[]> GenerateStatsPdfAsync(Guid tenantId, ProductReportFilterDto filter);
}