
public class MovimientoCaja
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid CajaId { get; set; }
        public Caja? Caja { get; set; }

        public string Tipo { get; set; } = "INGRESO"; // "INGRESO" o "EGRESO"
        public decimal Monto { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        public Guid? VentaId { get; set; }
    }