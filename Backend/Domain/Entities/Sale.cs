using Domain.Interfaces;

namespace Domain.Entities;

public class Sale : IMustHaveTenant
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; } 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Efectivo;
    
    public decimal ReceivedAmount { get; set; } 
    public decimal ChangeAmount { get; set; }
    public decimal Total { get; set; } 
    
    public ICollection<SaleDetail> Details { get; set; } = new List<SaleDetail>();
}