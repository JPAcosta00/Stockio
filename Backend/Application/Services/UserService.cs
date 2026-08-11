using Application.DTOs;
using Domain.Entities;
using Domain.Interfaces;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IGenericRepository<Tenant> _tenantRepository;

    public UserService(IUserRepository userRepository, IGenericRepository<Tenant> tenantRepository)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
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

    public async Task<IEnumerable<EmployeeResponseDto>> GetEmployeesByTenantAsync(Guid tenantId)
    {
        var users = await _userRepository.GetByTenantIdAsync(tenantId);
        
        return users
            .Where(u => u.TenantId == tenantId)
            .Select(u => new EmployeeResponseDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                IsActive = u.IsActive
            })
            .ToList(); 
    }

    public async Task<Guid> CreateEmployeeAsync(Guid tenantId, CreateEmployeeDto dto)
    {
        var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
        if (existingUser != null)
            throw new Exception("El correo electrónico ya se encuentra registrado.");

        var employee = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = string.IsNullOrWhiteSpace(dto.Role) ? "Empleado" : dto.Role,
            IsActive = true,
            TenantId = tenantId 
        };

        await _userRepository.AddAsync(employee);
        await _userRepository.SaveChangesAsync();

        return employee.Id;
    }

    // Método exclusivo para el rol ADMIN (devuelve todos los usuarios del sistema)
    public async Task<IEnumerable<EmployeeResponseDto>> GetAllUsersAsync()
    {
        // Traemos todos los usuarios ignorando los filtros globales de tenant
        var users = await _userRepository.GetAllAsync(null, ignoreQueryFilters: true); 
        var tenants = await _tenantRepository.GetAllAsync(null, ignoreQueryFilters: true); 
        
        return users.Select(u => {
            // Buscamos el tenant correspondiente al usuario por su ID
            var tenant = tenants.FirstOrDefault(t => t.Id == u.TenantId);
            
            // Si tiene un tenant asignado mostramos su nombre real, de lo contrario un fallback
            string companyName = tenant?.Name ?? "Sin Empresa";
    
            return new EmployeeResponseDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                IsActive = u.IsActive,
                CompanyName = companyName
            };
        });
    }

    public async Task<bool> UpdateEmployeeAsync(Guid tenantId, Guid employeeId, UpdateEmployeeDto dto)
    {
        var employee = await _userRepository.GetByIdAsync(employeeId);
        if (employee == null || employee.TenantId != tenantId)
            return false; // No existe o no pertenece al tenant del dueño

        // Verificar si el email cambió y si ya pertenece a otro usuario
        if (employee.Email != dto.Email)
        {
            var emailExists = await _userRepository.GetByEmailAsync(dto.Email);
            if (emailExists != null)
                throw new Exception("El correo electrónico ya está en uso por otro usuario.");
        }

        employee.Username = dto.Username;
        employee.Email = dto.Email;
        employee.Role = dto.Role;
        employee.IsActive = dto.IsActive;

        _userRepository.Update(employee);
        await _userRepository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleEmployeeStatusAsync(Guid tenantId, Guid employeeId)
    {
        var employee = await _userRepository.GetByIdAsync(employeeId);
        if (employee == null || employee.TenantId != tenantId)
            return false;

        employee.IsActive = !employee.IsActive; // Alternar estado (Activo/Inactivo)

        _userRepository.Update(employee);
        await _userRepository.SaveChangesAsync();
        return true;
    }
}