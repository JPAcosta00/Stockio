public class Caja
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid UsuarioId { get; set; }

        public decimal MontoInicial { get; set; }
        public DateTime FechaApertura { get; set; } = DateTime.UtcNow;
        public DateTime? FechaCierre { get; set; }

        public bool IsOpen { get; set; } = true;

        // Totales históricos guardados al cerrar el turno
        public decimal VentasEfectivo { get; set; }
        public decimal VentasMercadoPago { get; set; }
        public decimal VentasTarjeta { get; set; }
        public decimal MontoIngresosExtra { get; set; }
        public decimal MontoEgresosExtra { get; set; }

        public decimal EfectivoEsperado { get; set; }
        public decimal EfectivoRealContado { get; set; }
        public decimal Diferencia { get; set; }
        public string? Observaciones { get; set; }

        // Relación 1 a N con movimientos adicionales
        public ICollection<MovimientoCaja> Movimientos { get; set; } = new List<MovimientoCaja>();
    }