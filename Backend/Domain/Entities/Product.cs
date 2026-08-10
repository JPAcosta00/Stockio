using Domain.Enums;
using Domain.Interfaces;

namespace Domain.Entities;

public class Product : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Barcode { get; set; } = string.Empty; // Código de barras para el lector de la PC
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public ProductCategory Categoria { get; set; }
    public int MinimumStock { get; set; } // Para alertas de reposición
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? ProviderId { get; set; } // FK opcional
    public Provider? Provider { get; set; } // Propiedad de navegación

    // FK al Tenant
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public void UpdateDetails(string name, string barcode, decimal price, int stActual, int stockMinimum, string description, bool estado, Guid? provId, ProductCategory unaCat){
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("El nombre del producto no puede estar vacío.");
        if (price < 0) throw new ArgumentException("El precio no puede ser negativo.");
        if (stockMinimum < 0) throw new ArgumentException("El stock mínimo no puede ser negativo.");

        Name = name;
        Barcode = barcode;
        Price = price;
        Stock = stActual;
        MinimumStock = stockMinimum;
        Description = description;
        ProviderId = provId;
        IsActive = estado;
        Categoria = unaCat;
        UpdatedAt = DateTime.Now;
    }
}