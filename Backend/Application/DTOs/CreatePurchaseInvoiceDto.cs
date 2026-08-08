namespace Application.DTOs;
public class CreatePurchaseInvoiceDto
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTime InvoiceDate { get; set; }
    public Guid ProviderId { get; set; }
    // NUEVO: Los detalles de la factura (productos comprados)
    public List<CreateInvoiceDetailDto> Details { get; set; } = new();
}