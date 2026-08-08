using System.Text.Json.Serialization;

public class OcrResultDto
{
    [JsonPropertyName("items")]
    public List<OcrItemDto> Items { get; set; } = new();
}