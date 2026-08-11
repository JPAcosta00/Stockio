using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Infraestructure.Security;

public class JwtTokenBuilder : IJwtTokenBuilder
{
    private readonly IConfiguration _configuration;
    private readonly List<Claim> _claims = new();

    public JwtTokenBuilder(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public IJwtTokenBuilder WithUserId(Guid userId)
    {
        _claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));
        return this;
    }

    public IJwtTokenBuilder WithTenantId(Guid tenantId)
    {
        _claims.Add(new Claim("TenantId", tenantId.ToString()));
        return this;
    }

    public IJwtTokenBuilder WithUsername(string username)
    {
        _claims.Add(new Claim(ClaimTypes.Name, username));
        return this;
    }

    public IJwtTokenBuilder WithRole(string role)
    {
        _claims.Add(new Claim(ClaimTypes.Role, role));
        return this;
    }

    public IJwtTokenBuilder WithEmail(string email)
    {
        _claims.Add(new Claim(ClaimTypes.Email, email));
        return this;
    }

    public IJwtTokenBuilder WithCompanyName(string companyName)
    {
        _claims.Add(new Claim("CompanyName", companyName));
        return this;
    }

    public string Build()
    {
        try
        {
            var secretKey = _configuration["JwtSettings:Secret"] ?? "LlavePorDefectoMuyLargaYSeguraParaEvitarErrores123!";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"] ?? "SaaSStockAPI",
                audience: _configuration["JwtSettings:Audience"] ?? "SaaSStockReactClient",
                claims: _claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        finally
        {
            _claims.Clear();
        }
    }
}