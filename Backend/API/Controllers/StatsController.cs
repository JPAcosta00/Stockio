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
    [AllowAnonymous] // Se permite el acceso libre porque la validación del Token se hace manualmente adentro
    public async Task<IActionResult> DownloadStatsPdf(
        [FromQuery] string token, 
        [FromQuery] string? name, 
        [FromQuery] string? period)
    {
        if (string.IsNullOrEmpty(token))
        {
            return Unauthorized("Se requiere un token válido para acceder al reporte.");
        }

        try
        {
            // Decodificamos el token JWT enviado por la cámara
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            // Verificamos expiración del token
            if (jwtToken.ValidTo < DateTime.UtcNow)
            {
                return Unauthorized("El código QR ha expirado. Por favor, actualizá la pantalla.");
            }

            // Extraemos el TenantId desde los claims del token
            var tenantClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "TenantId" || c.Type == "tenantId")?.Value;
            if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out Guid tenantId))
            {
                return Unauthorized("Identificador de organización no válido.");
            }

            // Armamos el filtro con los parámetros que venían en la URL
            var filter = new ProductReportFilterDto
            {
                Name = string.IsNullOrEmpty(name) ? null : name,
                Period = string.IsNullOrEmpty(period) ? null : period
            };

            // Generamos el archivo PDF
            var pdfBytes = await _statsService.GenerateStatsPdfAsync(tenantId, filter);
            
            return File(pdfBytes, "application/pdf", $"Estadisticas_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");
        }
        catch (Exception)
        {
            return BadRequest("El código QR no es válido o está corrupto.");
        }
    }
}