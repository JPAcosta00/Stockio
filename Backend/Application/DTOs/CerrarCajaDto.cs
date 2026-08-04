public class CerrarCajaDto
    {
        public Guid CajaId { get; set; }
        public decimal EfectivoRealContado { get; set; }
        public string? Observaciones { get; set; }
    }

//DTO para la solicitud de arqueo y cierre de caja