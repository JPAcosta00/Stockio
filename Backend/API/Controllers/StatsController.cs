using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly IInventoryStatsService _statsService;

    public StatsController(IInventoryStatsService statsService)
    {
        _statsService = statsService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDataDto>> GetDashboardStats([FromQuery] string? name, [FromQuery] string? period)
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenantId")?.Value;

        if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");
        }

        var filter = new ProductReportFilterDto
        {
            Name = name,
            Period = period
        };

        var stats = await _statsService.GetStatsByInventoryFiltersAsync(tenantId, filter);
        return Ok(stats);
    }


    [HttpGet("download-pdf")]
    public async Task<IActionResult> DownloadStatsPdf([FromQuery] string? name, [FromQuery] string? period)
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenantId")?.Value;

        if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");
        }

        var filter = new ProductReportFilterDto
        {
            Name = string.IsNullOrEmpty(name) ? null : name,
            Period = string.IsNullOrEmpty(period) ? null : period
        };

        var pdfBytes = await _statsService.GenerateStatsPdfAsync(tenantId, filter);
        var fileName = $"Estadisticas_{DateTime.Now:yyyyMMdd_HHmm}.pdf";

        Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
        return File(pdfBytes, "application/pdf", fileName);
    }
}