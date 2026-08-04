public class RegistrarMovimientoDto
    {
        public Guid CajaId { get; set; }
        public string Tipo { get; set; } = "INGRESO"; // "INGRESO" o "EGRESO"
        public decimal Monto { get; set; }
        public string Concepto { get; set; } = string.Empty;
    }