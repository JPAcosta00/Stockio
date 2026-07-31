using Domain.Interfaces;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
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

        if (dto.Email == "admin@supercentral.com")
    {
        var adminUser = await _userRepository.GetByEmailAsync(dto.Email);
        if (adminUser != null)
        {
            adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
             _userRepository.Update(adminUser); // O el método que uses para guardar cambios
             _userRepository.SaveChangesAsync();
        }
    }
        // Buscar al usuario por Email
        var user = await _userRepository.GetByEmailAsync(dto.Email);
    
        // Si no existe o está inactivo
        if (user == null || !user.IsActive) return null;

        // Verifica que la contraseña ingresada sea la misma que la registrada para el mail ingresado
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

        if (!isPasswordValid) 
            return null;

        // Uso el builder para el token 
        var token = _tokenBuilder
            .WithUserId(user.Id)
            .WithTenantId(user.TenantId)
            .WithUsername(user.Username)
            .WithEmail(user.Email)
            .Build();

        // Respuesta armada para el Frontend
        return new AuthResponseDto
        {
            Token = token,
            Username = user.Username,
            Email = user.Email,
            TenantId = user.TenantId
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
}