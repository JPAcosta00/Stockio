using Application.DTOs;
using Domain.Interfaces;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<bool> UpdateProfileAsync(Guid userId, UpdateUserByAdminDto dto)
    {
        // Busca el usuario por el ID global
        var user = await _userRepository.GetByIdAsync(userId); 
        if (user == null) return false;

        // Valida si el mail ya existe
        var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
        if (existingUser != null && existingUser.Id != userId)
        {
            throw new Exception("El correo electrónico ya se encuentra registrado por otro usuario.");
        }

        // Actualiza los datos
        user.updateDatos(dto.Username, dto.Role, dto.IsActive, dto.Email, dto.TenantId);

         _userRepository.Update(user); 
         await _userRepository.SaveChangesAsync();
        return true; 
    }
}