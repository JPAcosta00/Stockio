using Domain.Interfaces;

namespace Domain.Entities;

public class User : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    //Resolver la parte de los roles por defecto
    public string Role { get; set; } = " - "; 
    public bool IsActive { get; set; } = true;

    // FK al Tenant: Cada usuario pertenece a UN SOLO supermercado
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }

    //este metodo es para cuando el ADMIN quiera modificar todo el usuario.
    public void updateDatos(String userNombre, String rol, bool? estado, String mail, Guid tenantId)
    {
        Username = userNombre;
        Role = rol;
        if (estado.HasValue)             //si trae un valor, se actualiza
            IsActive = estado.Value;
        Email = mail; 
        TenantId = tenantId;
    }
    
    //este metodo es para cuando el usuario quiera modificar su mail o nombre
    public void updatePerfil(String userNombre, String unMail)
    {
        Username = userNombre;
        Email = unMail;
    }

    public void SetResetToken(string token, DateTime expires)
    {
        ResetToken = token;
        ResetTokenExpires = expires;
    }

    public void UpdatePassword(string newPasswordHash)
    {
        PasswordHash = newPasswordHash;
        ResetToken = null;
        ResetTokenExpires = null;
    }
}