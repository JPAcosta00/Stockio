using System.Security.Claims;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/caja")]
public class CajaController : ControllerBase
{
    private readonly ICajaService _cajaService;

    public CajaController(ICajaService cajaService)
    {
        _cajaService = cajaService;
    }

    /// Obtiene la caja actualmente activa para el Tenant.
    [HttpGet("activa")]
    public async Task<ActionResult<CajaActivaResponseDto>> ObtenerCajaActiva()
    {
        var tenantId = ObtenerTenantId();
        if (tenantId == Guid.Empty) 
            return Unauthorized(new { mensaje = "No se encontró el TenantId en las credenciales." });

        var cajaActiva = await _cajaService.ObtenerCajaActivaAsync(tenantId);
        
        if (cajaActiva == null)
            return NotFound(new { mensaje = "No hay una caja abierta actualmente." });

        return Ok(cajaActiva);
    }

    /// Abre un turno de caja con el monto inicial.

    [HttpPost("abrir")]
    public async Task<ActionResult<CajaActivaResponseDto>> AbrirCaja([FromQuery] decimal montoDeInicio)
    {
        var tenantId = ObtenerTenantId();
        var usuarioId = ObtenerUsuarioId();

        if (tenantId == Guid.Empty || string.IsNullOrEmpty(usuarioId))
            return Unauthorized(new { mensaje = "Token inválido o credenciales incompletas." });

        try
        {
            var cajaAbierta = await _cajaService.AbrirCajaAsync(tenantId, usuarioId, montoDeInicio);
            return Ok(cajaAbierta);
        }
        catch (InvalidOperationException ex)
        {
            // Ocurre si ya existe una caja abierta
            return BadRequest(new { mensaje = ex.Message });
        }
    }


    /// Registra el arqueo y efectúa el cierre de la caja.
    [HttpPost("cerrar")]
    public async Task<ActionResult<CajaHistorialDto>> CerrarCaja([FromBody] CerrarCajaDto datosDeCierre)
    {
        var tenantId = ObtenerTenantId();
        var usuarioId = ObtenerUsuarioId();

        if (tenantId == Guid.Empty || string.IsNullOrEmpty(usuarioId))
            return Unauthorized(new { mensaje = "Token inválido o credenciales incompletas." });

        try
        {
            var cajaCerrada = await _cajaService.CerrarCajaAsync(tenantId, usuarioId, datosDeCierre);
            return Ok(cajaCerrada);
        }
        catch (KeyNotFoundException ex)
        {
            // Ocurre si no se encuentra la caja con el CajaId indicado
            return NotFound(new { mensaje = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // Ocurre si la caja ya está cerrada o hay incoherencias de estado
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpGet("reporte-pdf")]
    public async Task<ActionResult<string>> GenerarReporteCaja([FromQuery] string algunDato)
    {
        var tenantClaim = ObtenerTenantId();

        // Pendiente para más adelante
        return Ok("Reporte pendiente de implementación.");
    }

    // --- MÉTODOS AUXILIARES ---

    private Guid ObtenerTenantId()
    {
        var claimValue = User.FindFirst("TenantId")?.Value 
                      ?? User.FindFirst("tenantId")?.Value;

        return Guid.TryParse(claimValue, out var tenantId) ? tenantId : Guid.Empty;
    }

    private string ObtenerUsuarioId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value 
            ?? User.FindFirst("UsuarioId")?.Value 
            ?? string.Empty;
    }
}