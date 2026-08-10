using Application.DTOs;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces;
public interface IProductImportService
{
    Task<IEnumerable<ProductPreviewDto>> PreviewExcelAsync(IFormFile file, Guid tenantId);
    Task<ProductImportResultDto> ImportFromExcelAsync(IFormFile file, Guid tenantId, bool updateExisting);
}