namespace Application.DTOs;
using System.Text.Json.Serialization;
public class AbrirCajaDto
{
    [JsonPropertyName("montoDeInicio")]
    public decimal MontoDeInicio { get; set; }
}