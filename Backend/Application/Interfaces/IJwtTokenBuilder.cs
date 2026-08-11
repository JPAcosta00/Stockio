namespace Application.Interfaces;

public interface IJwtTokenBuilder
{
    IJwtTokenBuilder WithUserId(Guid userId);
    IJwtTokenBuilder WithTenantId(Guid tenantId);
    IJwtTokenBuilder WithUsername(string username);
    IJwtTokenBuilder WithEmail(string email);
    IJwtTokenBuilder WithCompanyName(string companyName);
    string Build();
}