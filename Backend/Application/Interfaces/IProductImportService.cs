using Application.DTOs;
using Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces;

public interface IProductImportService
{
    // Método para previsualizar los datos directamente desde el Excel
    Task<IEnumerable<ProductPreviewDto>> PreviewExcelAsync(IFormFile file, Guid tenantId);

    // Método para importar y guardar los productos desde la lista ya editada en el Frontend
    Task<int> ImportFromListAsync(List<ProductImportDto> productos, bool updateExisting, Guid tenantId);
}