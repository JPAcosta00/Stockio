namespace Application.DTOs;

public class ProductResponseDto
{
    public Guid Id { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int MinimumStock { get; set; }
    public bool IsActive { get; set; }
    public Guid? ProviderId { get; set; }
    public string? ProviderName { get; set; }
}