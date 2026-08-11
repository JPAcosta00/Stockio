using Application.DTOs;

public interface IUserService
{
    Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);

    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto);

    Task<IEnumerable<EmployeeResponseDto>> GetEmployeesByTenantAsync(Guid tenantId);
    Task<Guid> CreateEmployeeAsync(Guid tenantId, CreateEmployeeDto dto);
    Task<bool> UpdateEmployeeAsync(Guid tenantId, Guid employeeId, UpdateEmployeeDto dto);
    Task<bool> ToggleEmployeeStatusAsync(Guid tenantId, Guid employeeId);
    Task<IEnumerable<EmployeeResponseDto>> GetAllUsersAsync();
}