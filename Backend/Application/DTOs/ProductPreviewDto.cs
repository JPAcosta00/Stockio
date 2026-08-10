using Domain.Enums;

namespace Application.DTOs;

public class ProductPreviewDto
{
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int MinimumStock { get; set; }
    public ProductCategory Categoria { get; set; }
    public bool MissingCategoryInExcel { get; set; }
    public bool IsExisting { get; set; } // True si ya existe en la BD para este Tenant
    public DateTime? UpdatedAt { get; set; }
}