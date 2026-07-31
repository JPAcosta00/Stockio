using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
public class ChangePasswordDto{
        [Required(ErrorMessage = "La contraseña actual es obligatoria.")]
        [JsonPropertyName("currentPassword")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
        [RegularExpression(@"^(?=.*[a-zA-Z])(?=.*\d).{6,}$", 
            ErrorMessage = "La contraseña debe tener al menos 6 caracteres, incluir letras y al menos un número.")]
        [JsonPropertyName("newPassword")]
        public string NewPassword { get; set; } = string.Empty;
}