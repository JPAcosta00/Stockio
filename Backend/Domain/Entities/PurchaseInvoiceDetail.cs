using System;

namespace Domain.Entities;

public class PurchaseInvoiceDetail
{
    public Guid Id { get; set; }

    // Llave foránea a la factura principal
    public Guid PurchaseInvoiceId { get; set; }
    public PurchaseInvoice PurchaseInvoice { get; set; } = null!;

    // Llave foránea al producto
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    // Detalles de la operación
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; } // Precio al momento de la compra

}