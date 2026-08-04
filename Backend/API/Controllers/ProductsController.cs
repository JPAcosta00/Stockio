using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize] // Si React no manda un Token JWT válido, la API clava un 401 Unauthorized
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _productRepository;
    private readonly ITenantProvider _tenantProvider;
    private readonly IProductService _productService;
    private readonly IProductImportService _productImportService;
    private readonly IProductExportService _exportService;

    public ProductsController(IProductRepository productRepository,IProductExportService exportService, ITenantProvider tenantProvider, IProductImportService productImportService, IProductService productService)
    {
        _productRepository = productRepository;
        _tenantProvider = tenantProvider;
        _productService = productService;
        _productImportService = productImportService;
        _exportService = exportService;
    }

    // GET: api/products
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll([FromQuery] ProductReportFilterDto filter){
        // Delegamos el filtrado y la obtención al servicio de productos
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

        // delego la busqueda
        var productos = await _productService.GetFilteredProductsAsync(filter, tenantId);
        
        return Ok(productos);
    }

    // GET: api/products/barcode/{barcode}
    // Busca un producto específico por código de barras dentro del Tenant
    [HttpGet("barcode/{barcode}")]
    [Authorize]
    public async Task<IActionResult> GetByBarcode(string barcode){
        var product = await _productRepository.GetByBarcodeAsync(barcode);
        
        if (product == null){
            return NotFound($"No se encontró ningún producto con el código: {barcode}");
        }

        return Ok(product);
    }

    // POST: api/products
    // Crea un producto inyectándole el TenantId del token, osea del usuario que esta logueado
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] ProductCreateDto dto){
        var result = await _productService.CreateProductAsync(dto);
    
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id){
        var deleted = await _productService.DeleteProductAsync(id);
    
        if (!deleted){
            return NotFound("El producto no existe o no pertenece a tu comercio.");
        }

        return NoContent(); // Devuelve 204 exitoso sin contenido
    }

    //importar productos desde un archivo excel 
    [HttpPost("import")]
    [Authorize] 
    public async Task<IActionResult> Import(IFormFile file){
         // Valido que se este mandando un archivo
        if (file == null || file.Length == 0){
            return BadRequest("Por favor, seleccione un archivo de Excel válido.");
        }

        // Valido la extensión  (.xlsx)
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".xlsx"){
            return BadRequest("Formato no soportado. Debe subir un archivo de Excel con extensión .xlsx");
        }

        try{
            // Se invoca al motor que procesa el Excel
            var report = await _productImportService.ImportFromExcelAsync(file);

            // Si hubo errores en algunas filas pero otras se guardaron, se devuelve 200 con el reporte
            if (report.FailedRows > 0){
                return Ok(new { 
                    Message = "Importación finalizada con observaciones. Algunos registros fallaron.", 
                    Report = report 
                });
            }

            // Si todo salió  perfecto
            return Ok(new { 
                Message = "¡Todos los productos se importaron con éxito total!", 
                Report = report 
            });
        }
        catch (ArgumentException ex){
            //  error si el Excel está vacío o es inválido
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("export-excel")]
    [Authorize]
    public async Task<IActionResult> ExportExcel([FromQuery] ProductReportFilterDto filters){
        // TenantId del usuario actual
        var tenantClaim = User.FindFirst("TenantId")?.Value; 
        
        if (!Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return BadRequest("El identificador del Tenant no es válido.");
        }

      
        var productosFiltrados = await _productService.GetFilteredProductsAsync(filters, tenantId);

        var fileBytes = await _exportService.GenerateExcelAsync(productosFiltrados);

        // se retorna el archivo
        return File(
            fileBytes, 
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            $"ReporteProductos_{DateTime.UtcNow:yyyyMMdd}.xlsx"
        );
    }

    [HttpGet("export-pdf")]
    [Authorize]
    public async Task<IActionResult> ExportPdf([FromQuery] ProductReportFilterDto filters){
        // TenantId del usuario actual
        var tenantClaim = User.FindFirst("TenantId")?.Value; 
       
        if (!Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return BadRequest("El identificador del Tenant no es válido.");
        }

        var productosFiltrados = await _productService.GetFilteredProductsAsync(filters, tenantId);

        var fileBytes = await _exportService.GeneratePdfAsync(productosFiltrados);

        return base.File(
            fileBytes, 
            "application/pdf", 
            $"ReporteProductos_{DateTime.UtcNow:yyyyMMdd}.pdf"
        );
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpdateProductDto dto){
        try{
            await _productService.UpdateProductAsync(id, dto);
            return Ok(new { message = "Producto actualizado con éxito." });
        }
        catch (KeyNotFoundException ex){
            return NotFound(new { message = ex.Message }); // 404 si no existe o es de otro tenant
        }
        catch (Exception ex){
            return BadRequest(new { message = ex.Message });
        }
    }
}