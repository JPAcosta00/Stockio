using Domain.Interfaces;

namespace Domain.Entities;

public class PurchaseInvoice : IMustHaveTenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string InvoiceNumber { get; set; } = string.Empty; // Ej: A-0001-00004521
    public decimal TotalAmount { get; set; }                  // Monto total de la factura
    public decimal PaidAmount { get; set; } = 0;              // Cuánto se le fue pagando
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public bool IsPaid { get; set; } = false;                 // Si está saldada o pendiente

    // Relación con el Proveedor
    public Guid ProviderId { get; set; }
    public Provider Provider { get; set; } = null!;

    // Relación con el Tenant (Multitenant)
    public Guid TenantId { get; set; }
    public ICollection<PurchaseInvoiceDetail> Details { get; set; } = new List<PurchaseInvoiceDetail>();
}