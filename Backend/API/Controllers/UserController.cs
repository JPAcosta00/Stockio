using Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Authorize]
[ApiController]
[Route("api/[controller]")] // api/user
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPut("update-profile")] // api/user/update-profile
    public async Task<IActionResult> UpdateProfileAsync(UpdateProfileDto dto){
            if (!ModelState.IsValid){
                return BadRequest(ModelState);
            }

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid currentUserId))
            {
                return Unauthorized(new { message = "Token inválido o usuario no autenticado." });
            }

            try
            {
                var result = await _userService.UpdateProfileAsync(currentUserId, dto);

                if (!result)
                {
                    return NotFound(new { message = "No se pudo encontrar el perfil de usuario." });
                }

                return Ok(new { message = "Perfil actualizado con éxito." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            } 
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto){
        try{
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { message = "Token inválido o usuario no autenticado." });
            }

            await _userService.ChangePasswordAsync(userId, dto);

            return Ok(new { message = "Contraseña modificada con éxito." });
        }
        catch (ArgumentException ex){
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception){
            return StatusCode(500, new { message = "Error al intentar cambiar la contraseña." });
        }
    }

   [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees()
    {
        try
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
    
            if (!string.IsNullOrEmpty(userRole) && userRole.Equals("ADMIN", StringComparison.OrdinalIgnoreCase))
            {
                var allUsers = await _userService.GetAllUsersAsync();
                // Aseguramos que si es null, devuelva un array vacío [] en vez de null o un objeto suelto
                return Ok(allUsers ?? Enumerable.Empty<EmployeeResponseDto>());
            }
    
            var tenantIdStr = User.FindFirst("TenantId")?.Value ?? User.FindFirst("tenantId")?.Value;
            if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out Guid tenantId))
            {
                return Unauthorized(new { message = "Tenant no identificado en el token." });
            }
    
            var employees = await _userService.GetEmployeesByTenantAsync(tenantId);
            
            // ¡Garantía total de que siempre se retorna un array JSON [...]!
            return Ok(employees ?? Enumerable.Empty<EmployeeResponseDto>());
        }
        catch (Exception ex)
        {
            // En lugar de devolver un texto plano que rompe el .filter(), 
            // devolvemos un JSON limpio con el error pero asegurando formato
            return StatusCode(500, new { message = "Error interno al cargar empleados", details = ex.Message });
        }
    }

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out Guid tenantId))
        {
            return Unauthorized(new { message = "Tenant no identificado en el token." });
        }

        try
        {
            var employeeId = await _userService.CreateEmployeeAsync(tenantId, dto);
            return Ok(new { message = "Empleado creado con éxito.", employeeId });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("employees/{id}")]
    public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out Guid tenantId))
        {
            return Unauthorized(new { message = "Tenant no identificado en el token." });
        }

        try
        {
            var updated = await _userService.UpdateEmployeeAsync(tenantId, id, dto);
            if (!updated) return NotFound(new { message = "Empleado no encontrado." });

            return Ok(new { message = "Empleado actualizado con éxito." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("employees/{id}/toggle-status")]
    public async Task<IActionResult> ToggleEmployeeStatus(Guid id)
    {
        var tenantIdStr = User.FindFirst("TenantId")?.Value;
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out Guid tenantId))
        {
            return Unauthorized(new { message = "Tenant no identificado en el token." });
        }

        var success = await _userService.ToggleEmployeeStatusAsync(tenantId, id);
        if (!success) return NotFound(new { message = "Empleado no encontrado." });

        return Ok(new { message = "Estado del empleado modificado con éxito." });
    }
}