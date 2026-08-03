using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers
{
    [Authorize] 
    [ApiController]
    [Route("api/sales")]
    public class SalesController : ControllerBase
    {
        private readonly ISaleService _saleService;

        public SalesController(ISaleService saleService)
        {
            _saleService = saleService;
        }

        // 1. GET: api/sales (Historial)
        [HttpGet]
        public async Task<IActionResult> GetHistory(){
        
            var tenantIdClaim = User.FindFirst("TenantId")?.Value; 
            if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out Guid tenantId))
                {
                    return Unauthorized(new { Message = "El identificador de organización (Tenant) no es válido o no está presente." });
                }

            var history = await _saleService.GetSalesHistoryAsync(tenantId);
            return Ok(history);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSale([FromBody] CreateSaleDto dto)
        {
            try
            {
                // Extrae el TenantId
                var tenantIdClaim = User.FindFirst("TenantId")?.Value;
                
                if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out Guid tenantId))
                {
                    return Unauthorized(new { Message = "El identificador de organización (Tenant) no es válido o no está presente." });
                }

                // Delega la creacion al servicio
                var saleId = await _saleService.CreateSaleAsync(tenantId, dto);

                return Ok(new { Message = "Venta registrada con éxito e inventario actualizado.", SaleId = saleId });
            }
            catch (ArgumentException ex)
            {
                // Errores de validación de datos de entrada
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                // Errores de negocio (Ej: Stock insuficiente capturado en el loop del servicio)
                return BadRequest(new { Message = ex.Message });
            }
        }
    
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSaleById(Guid id){
            var tenantIdClaim = User.FindFirst("TenantId")?.Value;
            if (string.IsNullOrEmpty(tenantIdClaim) || !Guid.TryParse(tenantIdClaim, out Guid tenantId))
            {
                return Unauthorized(new { Message = "El identificador de organización (Tenant) no es válido o no está presente." });
            }

            var sale = await _saleService.GetSaleByIdAsync(tenantId, id);

            if (sale == null)
            {
                return NotFound(new { Message = "La venta solicitada no existe o no pertenece a su organización." });
            }

            return Ok(sale);
        }
    }
}