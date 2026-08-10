using Domain.Enums;

public class ProductReportFilterDto
{
    public string? Period { get; set; } // "hoy", "semana", "mes", "anio"
    public string? Name { get; set; }
    public bool? IsCriticalStock { get; set; }
    public ProductCategory? Category { get; set; } // <--- Nuevo campo para el filtro de categoría
}