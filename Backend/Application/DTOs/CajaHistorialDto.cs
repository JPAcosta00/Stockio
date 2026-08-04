public class CajaHistorialDto
    {
        public Guid Id { get; set; }
        public DateTime FechaApertura { get; set; }
        public DateTime? FechaCierre { get; set; }
        public decimal MontoInicial { get; set; }
        public decimal VentasEfectivo { get; set; }
        public decimal VentasMercadoPago { get; set; }
        public decimal VentasTarjeta { get; set; }
        public decimal TotalVendido { get; set; }
        public decimal EfectivoEsperado { get; set; }
        public decimal EfectivoRealContado { get; set; }
        public decimal Diferencia { get; set; }
        public string? Observaciones { get; set; }
    }