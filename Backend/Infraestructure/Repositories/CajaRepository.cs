using Domain.Entities;
using Domain.Interfaces;
using Infraestructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;


public class CajaRepository : GenericRepository<Caja>, ICajaRepository
    {
        public CajaRepository(ApplicationDbContext context) : base(context)
        {
        }

        /// Obtiene la caja abierta actual para el Tenant con los movimientos incluidos
        public async Task<Caja?> GetActivaByTenantAsync(Guid tenantId)
        {
            return await _dbSet
                .Include(c => c.Movimientos)
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.IsOpen);
        }

        /// Obtiene una caja por su ID e incluye la relación con sus Movimientos.
        public async Task<Caja?> GetByIdWithMovimientosAsync(Guid cajaId, Guid tenantId)
        {
            return await _dbSet
                .Include(c => c.Movimientos)
                .FirstOrDefaultAsync(c => c.Id == cajaId && c.TenantId == tenantId);
        }

        /// Obtiene el historial de cajas cerradas ordenadas por fecha reciente.
        public async Task<IEnumerable<Caja>> GetHistorialByTenantAsync(Guid tenantId, int take = 30)
        {
            return await _dbSet
                .Where(c => c.TenantId == tenantId && !c.IsOpen)
                .OrderByDescending(c => c.FechaApertura)
                .Take(take)
                .ToListAsync();
        }

        /// Registra un ingreso o egreso extra en la tabla MovimientosCaja.
        public async Task AddMovimientoAsync(MovimientoCaja movimiento)
        {
            await _context.Set<MovimientoCaja>().AddAsync(movimiento);
            await SaveChangesAsync();
        }

        /// Consulta las ventas realizadas en la tabla de Sales durante el lapso especificado
        /// y calcula los acumulados agrupados por método de pago.
        public async Task<(decimal Efectivo, decimal MercadoPago, decimal Tarjeta)> GetVentasTotalesPorTurnoAsync(Guid tenantId, DateTime fechaInicio, DateTime? fechaFin){
            var fechaHasta = fechaFin ?? DateTime.UtcNow;

            var ventas = await _context.Sales
                .Where(s => s.TenantId == tenantId && s.CreatedAt >= fechaInicio && s.CreatedAt <= fechaHasta)
                .Select(s => new { s.PaymentMethod, s.Total })
                .ToListAsync();

            decimal efectivo = ventas
                .Where(v => string.Equals(v.PaymentMethod.ToString(), "Efectivo", StringComparison.OrdinalIgnoreCase))
                .Sum(v => v.Total);

            decimal mercadoPago = ventas
                .Where(v => string.Equals(v.PaymentMethod.ToString(), "MercadoPago", StringComparison.OrdinalIgnoreCase) || 
                            string.Equals(v.PaymentMethod.ToString(), "Digital", StringComparison.OrdinalIgnoreCase))
                .Sum(v => v.Total);

            decimal tarjeta = ventas
                .Where(v => string.Equals(v.PaymentMethod.ToString(), "Tarjeta", StringComparison.OrdinalIgnoreCase) || 
                            string.Equals(v.PaymentMethod.ToString(), "Debito", StringComparison.OrdinalIgnoreCase) || 
                            string.Equals(v.PaymentMethod.ToString(), "Credito", StringComparison.OrdinalIgnoreCase))
                .Sum(v => v.Total);

            return (efectivo, mercadoPago, tarjeta);
        }
    }