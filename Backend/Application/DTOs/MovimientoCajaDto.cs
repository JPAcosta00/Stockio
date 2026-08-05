public class MovimientoCajaDto
    {
        public Guid Id { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }

    }

//resumen con el movimiento individual de caja