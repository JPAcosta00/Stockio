using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Application.DTOs{
public class UpdateProfileDto{
        [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "El email es obligatorio.")]
        [EmailAddress(ErrorMessage = "El formato de email no es válido.")]
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
}
}