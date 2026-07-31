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
    public async Task<(AuthResponseDto? Response, string? ErrorMessage)> LoginAsync(LoginDto dto)
{
    var user = await _userRepository.GetByEmailAsync(dto.Email);
    if (user == null) 
        return (null, "DIAGNOSTICO: El usuario no existe en la BD.");

    if (!user.IsActive) 
        return (null, "DIAGNOSTICO: El usuario existe pero IsActive es false.");

    bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
    if (!isPasswordValid) 
        return (null, $"DIAGNOSTICO: Password incorrecta. Se probó '{dto.Password}' contra hash '{user.PasswordHash}'");

    var token = _tokenBuilder
        .WithUserId(user.Id)
        .WithTenantId(user.TenantId)
        .WithUsername(user.Username)
        .WithEmail(user.Email)
        .Build();

    var result = new AuthResponseDto
    {
        Token = token,
        Username = user.Username,
        Email = user.Email,
        TenantId = user.TenantId
    };

    return (result, null);
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