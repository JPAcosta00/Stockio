using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

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

    /// <summary>
    /// Descarga pública de PDF autorizada vía Token enviado en la URL por el QR
    /// </summary>
    [HttpGet("download-pdf")]
[AllowAnonymous]
public async Task<IActionResult> DownloadStatsPdf(
    [FromQuery] string token, 
    [FromQuery] string? name, 
    [FromQuery] string? period)
{
    if (string.IsNullOrEmpty(token))
    {
        return Unauthorized("Token no proporcionado.");
    }

    try
    {
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(token);

        if (jwtToken.ValidTo < DateTime.UtcNow)
        {
            return Unauthorized("El código QR ha expirado. Por favor, actualizá la pantalla.");
        }

        var tenantClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "TenantId" || c.Type == "tenantId")?.Value;
        if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return Unauthorized("Identificador de organización no válido.");
        }

        var filter = new ProductReportFilterDto
        {
            Name = string.IsNullOrEmpty(name) ? null : name,
            Period = string.IsNullOrEmpty(period) ? null : period
        };

        var pdfBytes = await _statsService.GenerateStatsPdfAsync(tenantId, filter);

        // Forzamos la descarga asignando el nombre de archivo y Content-Type explícito
        var fileName = $"Estadisticas_{DateTime.Now:yyyyMMdd_HHmm}.pdf";
        Response.Headers.Append("Content-Disposition", $"inline; filename={fileName}");

        return File(pdfBytes, "application/pdf", fileName);
    }
    catch (Exception)
    {
        return BadRequest("El código QR no es válido o está corrupto.");
    }
}
}