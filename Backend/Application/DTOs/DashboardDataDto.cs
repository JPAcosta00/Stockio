
namespace Application.DTOs{

    public class SalesTimelineDto{
        public string Date { get; set; } = string.Empty; // Ej: "04/08" o "14:00"
        public decimal Total { get; set; }
    }

    public class DashboardDataDto{
        public DashboardMetricsDto Metrics { get; set; } = null!;
        
        public List<TopProductDto> TopProducts { get; set; } = new();

        public List<SalesTimelineDto> SalesTimeline { get; set; } = new();
    }
}