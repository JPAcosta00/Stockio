using Domain.Interfaces;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using Domain.Entities;

namespace Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenBuilder _tokenBuilder;
    private readonly IConfiguration _configuration;
    private readonly IGenericRepository<Tenant> _tenantRepository;

    public AuthService(IUserRepository userRepository, IGenericRepository<Tenant> tenantRepository,IConfiguration configuration, IJwtTokenBuilder tokenBuilder)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _tokenBuilder = tokenBuilder;
        _tenantRepository = tenantRepository;
    }

    public async Task<Guid> RegisterAsync(RegisterDto dto){
        // Valida que el email no esté duplicado 
        var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
        if (existingUser != null) 
            throw new Exception("El correo electrónico ya se encuentra registrado.");

        Guid nuevoTenantId = Guid.NewGuid();

        var newTenant = new Tenant
        {
            Id = nuevoTenantId,
            Name = dto.BusinessName,
            CreatedAt = DateTime.Now,
            IsActive = true
        };

        await _tenantRepository.AddAsync(newTenant); 
        await _tenantRepository.SaveChangesAsync(); 

        // ya con el tenant en la base de datos, se crea el usuario
        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Empresa",
            IsActive = true,
            TenantId = newTenant.Id
        };

        await _userRepository.AddAsync(newUser);
        await _userRepository.SaveChangesAsync(); 

        return nuevoTenantId;
    }
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto){
        var user = await _userRepository.GetByEmailAsync(dto.Email);
        if (user == null || !user.IsActive) return null;

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!isPasswordValid) return null;

        // Opcional: Si necesitas buscar el nombre del Tenant desde la entidad Tenant
        var tenant = await _tenantRepository.GetByIdAsync(user.TenantId);
        string businessName = !string.IsNullOrWhiteSpace(tenant?.Name) ? tenant.Name : "Mi Negocio";
        
        // Uso el builder para el token (añade el claim de la empresa si tu builder lo soporta)
        var token = _tokenBuilder
            .WithUserId(user.Id)
            .WithTenantId(user.TenantId)
            .WithUsername(user.Username)
            .WithEmail(user.Email)
            .WithCompanyName(businessName) 
            .Build();

        return new AuthResponseDto
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            TenantId = user.TenantId,
            BusinessName = businessName 
        };
    }    
    private static readonly Guid SuperAdminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public async Task UpdateUserByAdminAsync(Guid userId, UpdateUserByAdminDto dto, Guid currentUserId){
        //  Si no es el superAdmin no puede modificar usuarios
        if (currentUserId != SuperAdminId){
            throw new UnauthorizedAccessException("Acceso denegado. Solo el Administrador Central tiene autorización para realizar modificaciones globales.");
        }

        // Busca al usuario usando el método del repositorio que ignora los Tenants
        var user = await _userRepository.GetByIdIgnoreTenantAsync(userId);
        if (user == null)
            throw new Exception("El usuario especificado no existe en el sistema.");

    
        user.updateDatos(dto.Username, dto.Role, dto.IsActive, dto.Email, dto.TenantId);

        await _userRepository.SaveChangesAsync();
    }

    public async Task GenerateResetTokenAsync(string email){
        // Usa GetByEmailAsync que ignora QueryFilters por si el usuario aún no tiene tenant resoluble
        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null || !user.IsActive) 
        {
            // Retornamos sin lanzar excepción por motivos de seguridad (evitar enumeración de emails)
            return; 
        }

        // Genera un token aleatorio seguro de 64 bytes codificado en Base64 URL-safe
        var tokenBytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToHexString(tokenBytes);

        // Asigna el token y define expiración (ej. 1 hora)
        user.SetResetToken(token, DateTime.UtcNow.AddHours(1));

        await _userRepository.SaveChangesAsync();

        // TODO: Enviar correo electrónico con el token o enlace
        // Ej: https://tu-frontend.com/reset-password?token={token}
        Console.WriteLine($"Token de recuperación para {user.Email}: {token}");
    }
    
    public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token) || string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            throw new ArgumentException("El token y la nueva contraseña son obligatorios.");
        }
    
        var user = await _userRepository.GetByResetTokenAsync(dto.Token);
        
        if (user == null)
        {
            // Token inexistente o expirado
            return false;
        }
    
        // Hashea la nueva contraseña con BCrypt
        string newPasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        
        // Actualiza el hash y limpia el token usado
        user.UpdatePassword(newPasswordHash);
    
        await _userRepository.SaveChangesAsync();
        return true;
    }
}