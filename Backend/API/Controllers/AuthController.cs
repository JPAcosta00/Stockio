using System.Security.Claims;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")] // La URL va a ser: api/auth
public class AuthController : ControllerBase{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // Endpoint para el Login
    // URL: POST api/auth/login
    [HttpPost("login")]
public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
{
    var (result, errorMessage) = await _authService.LoginAsync(dto);

    if (result == null)
    {
        return Unauthorized(new { message = errorMessage });
    }

    return Ok(result);
}
    [HttpPost("register")]
    [AllowAnonymous] // Permite que cualquiera se registre sin estar logueado
    public async Task<IActionResult> Register([FromBody] RegisterDto dto){
        // Se valida que los datos del DTO cumplan con las limitaciones de quien lo puede ejecutar
        if (!ModelState.IsValid){
            return BadRequest(ModelState);
        }

        try{
            // Se llama al servicio que maneja la lógica y los repositorios
            var tenantId = await _authService.RegisterAsync(dto);
            return Ok(new { 
                message = "Usuario y empresa registrados correctamente.", 
                tenantId 
            });
        }
        catch (Exception ex){
            // Si salta la excepción del Email duplicado o cualquier otra, se captura aca
            return BadRequest(new { error = ex.Message });
        }
    }
    

    [HttpPut("users/{id:guid}")]
    [Authorize] // Requiere que este logueado, es decir que se mande el "Bearer "token""
    public async Task<IActionResult> UpdateUserFull(Guid id, [FromBody] UpdateUserByAdminDto dto){
        try{
            // Agarro el ID del usuario del Token 
            var nameIdentifierClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
            if (string.IsNullOrEmpty(nameIdentifierClaim) || !Guid.TryParse(nameIdentifierClaim, out Guid currentUserId))
            {
                return Unauthorized(new { message = "Token inválido o no se pudo identificar al usuario." });
            }

            // Si esta todo OK, ejecuta la logica para modificar el usuario
            await _authService.UpdateUserByAdminAsync(id, dto, currentUserId);
        
            return Ok(new { message = "Usuario modificado por completo con éxito por el Administrador Central." });
        }
        catch (UnauthorizedAccessException ex){
            return StatusCode(403, new { message = ex.Message }); // 403 es por si se loguearon con otro usuario que no es el admin
        }
        catch (Exception ex){
            return BadRequest(new { message = ex.Message });
        }
    }
}