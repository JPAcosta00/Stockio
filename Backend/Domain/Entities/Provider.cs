namespace Domain.Entities 
{
    public class Provider
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }  // Para aislar por kiosco
        public string Name { get; set; } = string.Empty;
        public string? ContactName { get; set; }
        public string? Phone { get; set; }
        public string? Cuit { get; set; }
        public decimal AccountBalance { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Tenant? Tenant { get; set; } = null!;

        // Relación: Un proveedor tiene muchos productos
        public ICollection<Product> Products { get; set; } = new List<Product>();

        public ICollection<PurchaseInvoice> PurchaseInvoices { get; set; } = new List<PurchaseInvoice>();

        // Propiedad calculada útil para obtener el saldo pendiente al vuelo
        public decimal CurrentAccountBalance => PurchaseInvoices.Where(i => !i.IsPaid).Sum(i => i.TotalAmount - i.PaidAmount);
    }
}