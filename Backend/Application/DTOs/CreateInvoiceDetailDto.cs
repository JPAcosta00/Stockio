namespace Application.DTOs;
public class CreateInvoiceDetailDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; } // Precio de compra
}