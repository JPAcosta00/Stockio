using Application.DTOs;
using Domain.Interfaces;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDto dto)
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
        user.updatePerfil(dto.Username, dto.Email);

         _userRepository.Update(user); 
         await _userRepository.SaveChangesAsync();
        return true; 
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto) // O string email
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new Exception("Usuario no encontrado.");

        Console.WriteLine($"DEBUG - Intentando verificar clave: '{dto.CurrentPassword}' contra Hash: '{user.PasswordHash}'");
        // 1. Validar si la contraseña actual coincide con el hash guardado
        bool currentPasswordIsValid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash);
        
        if (!currentPasswordIsValid)
        {
            throw new ArgumentException("La contraseña actual es incorrecta.");
        }

        // 2. Hashear la nueva contraseña y actualizar
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
    }
}