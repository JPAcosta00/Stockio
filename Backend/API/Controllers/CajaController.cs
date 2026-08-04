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
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
                
        if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out Guid tenantId)){
            return Unauthorized(new { Message = "El identificador de organización (Tenant) no es válido o no está presente." });
        }

        var cajaActiva = await _cajaService.ObtenerCajaActivaAsync(tenantId);
        
        if (cajaActiva == null)
            return NotFound(new { mensaje = "No hay una caja abierta actualmente." });

        return Ok(cajaActiva);
    }

    /// Abre un turno de caja con el monto inicial.

    [HttpPost("abrir")]
    public async Task<ActionResult<CajaActivaResponseDto>> AbrirCaja([FromBody] AbrirCajaDto dto)
    {
        // 1. Obtener y validar TenantId
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out Guid tenantId))
        {
            return Unauthorized(new { Message = "El identificador de organización (Tenant) no es válido o no está presente." });
        }

        // 2. Obtener y validar UsuarioId
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid usuarioId))
        {
            return Unauthorized(new { Message = "El identificador del usuario no es válido o no está presente en el token." });
        }

        try
        {
            var cajaAbierta = await _cajaService.AbrirCajaAsync(tenantId, usuarioId, dto.MontoDeInicio);
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
        // 1. Obtener y validar TenantId
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out Guid tenantId)){
             return Unauthorized(new { mensaje = "El identificador de organización (Tenant) no es válido o no está presente." });
        }

        // 2. Obtener y validar UsuarioId
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid usuarioId)) {
            return Unauthorized(new { mensaje = "El identificador del usuario no es válido o no está presente en el token." });
        }

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

    [HttpPost("movimientos")]
    public async Task<ActionResult<MovimientoCajaDto>> RegistrarMovimiento([FromBody] RegistrarMovimientoDto dto){
        // 1. Validar TenantId del claim del usuario
        var tenantIdClaim = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out Guid tenantId))
        {
            return Unauthorized(new { Message = "El identificador de la organización (Tenant) no es válido." });
        }
    
        try
        {
            var movimientoCreado = await _cajaService.RegistrarMovimientoAsync(tenantId, dto);
            return Ok(movimientoCreado);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    // --- MÉTODOS AUXILIARES ---

    private Guid ObtenerTenantId()
    {
        var claimValue = User.FindFirst("TenantId")?.Value 
                      ?? User.FindFirst("tenantId")?.Value;

        return Guid.TryParse(claimValue, out var tenantId) ? tenantId : Guid.Empty;
    }

}

//Refactorizar con Move_Method la parte de validar el Tenant y el usuario xq hay codigo repetido