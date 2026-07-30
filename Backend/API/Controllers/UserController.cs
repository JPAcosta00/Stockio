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
                // El controlador delega TODA la responsabilidad a la capa de aplicación
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
            // Extrae el ID del usuario directamente de las claims del token JWT
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
            {
                return Unauthorized(new { message = "Token inválido o usuario no autenticado." });
            }

            await _userService.ChangePasswordAsync(userId, dto);

            return Ok(new { message = "Contraseña modificada con éxito." });
        }
        catch (ArgumentException ex){
            // Captura el mensaje si la contraseña actual no es correcta
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception){
            return StatusCode(500, new { message = "Error al intentar cambiar la contraseña." });
        }
    }
}


//refactorizar la parte de extraer el id de usuario, CODIGO REPETIDO