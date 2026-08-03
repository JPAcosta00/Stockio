public class ProductReportFilterDto
{
    public string? Period { get; set; } // "hoy", "semana", "mes", "anio"
    public string? Name { get; set; }
    public bool? IsCriticalStock { get; set; }
}