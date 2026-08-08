using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Domain.Entities;
using Application.Interfaces;

[Authorize] 
[Route("api/providers")]
[ApiController]
public class ProvidersController : ControllerBase
{
    private readonly IProviderService _providerService;

    public ProvidersController(IProviderService providerService)
    {
        _providerService = providerService;
    }

    private Guid? GetTenantId()
    {
        var tenantClaim = User.FindFirst("TenantId")?.Value;

        if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out Guid tenantId))
        {
            return null;
        }

        return tenantId;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tenantId = GetTenantId();
        if (tenantId == null)
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");

        var providers = await _providerService.GetProvidersAsync(tenantId.Value);
        return Ok(providers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var tenantId = GetTenantId();
        if (tenantId == null)
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");

        var provider = await _providerService.GetProviderByIdAsync(id, tenantId.Value);
        if (provider == null) return NotFound();
        return Ok(provider);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Provider provider)
    {
        var tenantId = GetTenantId();
        if (tenantId == null)
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");

        await _providerService.CreateProviderAsync(provider, tenantId.Value);
        return CreatedAtAction(nameof(GetById), new { id = provider.Id }, provider);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] Provider provider)
    {
        if (id != provider.Id) return BadRequest();

        var tenantId = GetTenantId();
        if (tenantId == null)
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");

        try
        {
            await _providerService.UpdateProviderAsync(provider, tenantId.Value);
            return NoContent();
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenantId = GetTenantId();
        if (tenantId == null)
            return Unauthorized("No se pudo determinar el Tenant del usuario actual.");

        try
        {
            await _providerService.DeleteProviderAsync(id, tenantId.Value);
            return NoContent();
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }
}