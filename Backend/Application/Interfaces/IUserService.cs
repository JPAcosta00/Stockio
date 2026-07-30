using Application.DTOs;

public interface IUserService
{
    Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDto dto);

    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
}