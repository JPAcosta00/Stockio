using Microsoft.AspNetCore.Http;

public interface IOcrService
{
    Task<OcrResultDto> ProcesarTicketAsync(IFormFile file);
    Task ProcesarYGuardarInventarioAsync(IFormFile file, decimal margenGanancia, Guid tenantId);
}