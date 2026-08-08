using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Application.Interfaces;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class OcrController : ControllerBase
{
    private readonly IOcrService _ocrService;

    public OcrController(IOcrService ocrService)
    {
        _ocrService = ocrService;
    }

    /// <summary>
    /// Escanea la factura o ticket y devuelve los productos detectados en formato JSON para que el usuario los revise.
    /// </summary>
    [HttpPost("scan-invoice")]
    public async Task<IActionResult> ScanInvoice(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No se ha proporcionado ningún archivo o el archivo está vacío." });

            var resultado = await _ocrService.ProcesarTicketAsync(file);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al procesar el archivo mediante OCR: {ex.Message}" });
        }
    }

    /// <summary>
    /// Procesa el archivo OCR y actualiza/crea automáticamente el inventario aplicando el margen de ganancia indicado.
    /// </summary>
    [HttpPost("guardar-inventario")]
    public async Task<IActionResult> GuardarInventarioDesdeOcr([FromForm] IFormFile file, [FromForm] decimal margenGanancia)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No se ha proporcionado ningún archivo." });

            // Extraemos el TenantId del usuario autenticado (ajustá el Claim según cómo guardes el tenant en tu JWT)
            var tenantClaim = User.FindFirst("TenantId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            
            if (tenantClaim == null || !Guid.TryParse(tenantClaim.Value, out Guid tenantId))
            {
                // Si tu estructura maneja el tenant de otra forma (ej. por header o claims específicos), adaptarlo aquí:
                // Ejemplo alternativo buscando en los headers: 
                if (Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader) && Guid.TryParse(tenantHeader, out tenantId))
                {
                    // Tenant obtenido por header
                }
                else
                {
                    return BadRequest(new { message = "No se pudo identificar el Tenant del usuario actual." });
                }
            }

            await _ocrService.ProcesarYGuardarInventarioAsync(file, margenGanancia, tenantId);

            return Ok(new { message = "Inventario actualizado y sincronizado correctamente mediante OCR." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al guardar el inventario por OCR: {ex.Message}" });
        }
    }
}