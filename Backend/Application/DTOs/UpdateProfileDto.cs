using System.ComponentModel.DataAnnotations;

namespace Application.DTOs{
public class UpdateProfileDto{
        [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "El email es obligatorio.")]
        [EmailAddress(ErrorMessage = "El formato de email no es válido.")]
        public string Email { get; set; } = string.Empty;
}
}