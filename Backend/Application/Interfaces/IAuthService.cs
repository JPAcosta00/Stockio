using Application.DTOs;

namespace Application.Interfaces;

public interface IAuthService
{
    // Método que procesa el login y devuelve el token con los datos del usuario
    Task<(AuthResponseDto? Response, string? ErrorMessage)> LoginAsync(LoginDto dto);

    //metodo para el registro de nuevos usaurios
    Task<Guid> RegisterAsync(RegisterDto dto);

    Task UpdateUserByAdminAsync(Guid userId, UpdateUserByAdminDto dto, Guid currentUserId);
}