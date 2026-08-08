using System.Text.Json.Serialization;

namespace Application.DTOs
{
    public class UpdateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string Barcode { get; set; } = string.Empty;
        public decimal Price { get; set; }
        
        [JsonPropertyName("stock")]
        public int StockActual {get; set;}
        
        public Guid? ProviderId { get; set; }
        
        [JsonPropertyName("minimumStock")]
        public int StockMinimum { get; set; }
        public string Description { get; set; } = string.Empty;

        public bool State {get; set;} = true;
    }
}