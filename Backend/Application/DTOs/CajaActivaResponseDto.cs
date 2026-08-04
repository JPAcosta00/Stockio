public class CajaActivaResponseDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string UsuarioId { get; set; } = string.Empty;
        public bool IsOpen { get; set; }
        public decimal MontoInicial { get; set; }
        public DateTime FechaApertura { get; set; }

        // Totales de ventas calculados dinámicamente según método de pago
        public decimal VentasEfectivo { get; set; }
        public decimal VentasMercadoPago { get; set; }
        public decimal VentasTarjeta { get; set; }

        // Ingresos y egresos adicionales de efectivo
        public decimal MontoIngresosExtra { get; set; }
        public decimal MontoEgresosExtra { get; set; }

        // Efectivo esperado en el cajón = Inicial + VentasEfectivo + IngresosExtra - EgresosExtra
        public decimal EfectivoEsperado { get; set; }
        
        // Movimientos detallados de la caja
        public List<MovimientoCajaDto> Movimientos { get; set; } = new();
    }