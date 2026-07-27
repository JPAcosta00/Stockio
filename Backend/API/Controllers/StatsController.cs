using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly IInventoryStatsService _statsService;

    public StatsController(IInventoryStatsService statsService)
    {
        _statsService = statsService;
    }

    [HttpGet ("dashboard")]
    public async Task<ActionResult<DashboardDataDto>> GetDashboardStats([FromQuery] string? name,[FromQuery] string? period)
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;

        if (string.IsNullOrEmpty(tenantClaim))
        {
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");
        }

        // Convierto el string a guid
        if (!Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return BadRequest("El identificador del Tenant no es válido.");
        }


        // Mapeao el DTO del producto filtrado
        var filter = new ProductReportFilterDto
        {
            Name = name,
            Period = period
        };

        var stats = await _statsService.GetStatsByInventoryFiltersAsync(tenantId, filter);
        return Ok(stats);
    }

    [HttpGet("download-pdf")]
    [AllowAnonymous] // Permite el acceso libre desde el lector de cámara del celular
    public async Task<IActionResult> DownloadStatsPdf([FromQuery] Guid tenantId, [FromQuery] string? name, [FromQuery] string? period){
        if (tenantId == Guid.Empty){
            return BadRequest("El identificador del Tenant es requerido.");
        }

        var filter = new ProductReportFilterDto{
            Name = name,
            Period = period
        };

        var pdfBytes = await _statsService.GenerateStatsPdfAsync(tenantId, filter);

        // Retorna el archivo con 'attachment' para disparar la descarga directa en el dispositivo
        return File(pdfBytes, "application/pdf", $"Estadisticas_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");
    }
}