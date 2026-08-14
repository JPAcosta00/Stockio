public class ProductImportDto
{
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal PrecioFinal { get; set; }
    public int NuevoStock { get; set; }
    public int NuevoStockMin { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public bool IsExisting { get; set; }
}