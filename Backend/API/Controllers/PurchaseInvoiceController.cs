using Application.DTOs;
using Application.Interfaces;
using Application.Services; 
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers; 

[Authorize] // Exige que el usuario esté logueado para extraer su TenantId del token JWT
[ApiController]
[Route("api/[controller]")]
public class PurchaseInvoicesController : ControllerBase
{
    private readonly IPurchaseInvoiceService _invoiceService;

    public PurchaseInvoicesController(IPurchaseInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PurchaseInvoiceDto>>> GetAll()
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var invoices = await _invoiceService.GetAllAsync(tenantId);
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error interno al obtener las facturas", error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<PurchaseInvoiceDto>> Create([FromBody] CreatePurchaseInvoiceDto dto)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            var createdInvoice = await _invoiceService.CreateAsync(dto, tenantId);
            
            // Retorna un 200 OK o un 201 Created apuntando al recurso
            return Ok(createdInvoice);
        }
        catch (InvalidOperationException ex)
        {
            // Errores de negocio controlados (ej. monto inválido, proveedor inexistente)
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error interno al crear la factura", error = ex.Message });
        }
    }

    [HttpPatch("{id}/pay")]
    public async Task<IActionResult> MarkAsPaid(Guid id)
    {
        try
        {
            var tenantId = GetCurrentTenantId();
            await _invoiceService.MarkAsPaidAsync(id, tenantId);
            return Ok(new { message = "Factura marcada como pagada con éxito." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error interno al procesar el pago de la factura", error = ex.Message });
        }
    }

    private Guid GetCurrentTenantId()
    {
        // Busca el Claim correspondiente al TenantId en el token JWT del usuario actual.
        var tenantClaim = User.FindFirst("TenantId")?.Value;

        if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out var tenantId))
        {
            throw new UnauthorizedAccessException("No se pudo identificar el Tenant del usuario autenticado.");
        }

        return tenantId;
    }
}