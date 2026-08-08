using System.Text.Json.Serialization;

public class OcrItemDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("stock")]
    public int Stock { get; set; }

    [JsonPropertyName("price")]
    public decimal Price { get; set; }

    [JsonPropertyName("barcode")]
    public string Barcode { get; set; } = string.Empty;
}