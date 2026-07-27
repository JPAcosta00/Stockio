using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/stats")] // Ruta en minúsculas para compatibilidad total con servidores Linux (Render)
public class StatsController : ControllerBase
{
    private readonly IInventoryStatsService _statsService;

    // Almacenamiento temporal en memoria para tickets de descarga (Expira en 3 min)
    private static readonly ConcurrentDictionary<string, (Guid TenantId, string? Name, string? Period, DateTime ExpiresAt)> _downloadTickets = new();

    public StatsController(IInventoryStatsService statsService)
    {
        _statsService = statsService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDataDto>> GetDashboardStats([FromQuery] string? name, [FromQuery] string? period)
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenantId")?.Value;

        if (string.IsNullOrEmpty(tenantClaim))
        {
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");
        }

        if (!Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return BadRequest("El identificador del Tenant no es válido.");
        }

        var filter = new ProductReportFilterDto
        {
            Name = name,
            Period = period
        };

        var stats = await _statsService.GetStatsByInventoryFiltersAsync(tenantId, filter);
        return Ok(stats);
    }

    /// <summary>
    /// Endpoint Autenticado: Genera un ticket corto y temporal para incluir en la URL del QR.
    /// </summary>
    [HttpGet("qr-ticket")]
    public IActionResult GetQrTicket([FromQuery] string? name, [FromQuery] string? period)
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenantId")?.Value;

        if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return Unauthorized("No se pudo determinar la organización activa.");
        }

        // Generamos un ticket único de 32 caracteres y fijamos vigencia de 3 minutos
        var ticket = Guid.NewGuid().ToString("N");
        var expiresAt = DateTime.UtcNow.AddMinutes(3);

        _downloadTickets[ticket] = (tenantId, name, period, expiresAt);

        return Ok(new { ticket });
    }

    /// <summary>
    /// Endpoint Público: Recibe el ticket del QR, valida que exista y no haya expirado, y descarga el PDF.
    /// </summary>
    [HttpGet("download-pdf")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadStatsPdf([FromQuery] string ticket)
    {
        if (string.IsNullOrEmpty(ticket) || !_downloadTickets.TryGetValue(ticket, out var ticketData))
        {
            return NotFound("El código QR es inválido o ha sido utilizado.");
        }

        // Verificamos si expiró
        if (DateTime.UtcNow > ticketData.ExpiresAt)
        {
            _downloadTickets.TryRemove(ticket, out _);
            return Unauthorized("El código QR ha expirado. Generá uno nuevo actualizando la pantalla.");
        }

        // Se elimina el ticket una vez usado para evitar reutilizaciones
        _downloadTickets.TryRemove(ticket, out _);

        var filter = new ProductReportFilterDto
        {
            Name = string.IsNullOrEmpty(ticketData.Name) ? null : ticketData.Name,
            Period = string.IsNullOrEmpty(ticketData.Period) ? null : ticketData.Period
        };

        var pdfBytes = await _statsService.GenerateStatsPdfAsync(ticketData.TenantId, filter);
        var fileName = $"Estadisticas_{DateTime.Now:yyyyMMdd_HHmm}.pdf";

        Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
        return File(pdfBytes, "application/pdf", fileName);
    }
}