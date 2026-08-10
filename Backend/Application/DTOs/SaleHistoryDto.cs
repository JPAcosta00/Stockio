public class SaleHistoryDto
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal Total { get; set; }
    public List<SaleDetailDto> Items { get; set; } = new();
}