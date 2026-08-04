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
        public async Task<(decimal Efectivo, decimal MercadoPago, decimal Tarjeta)> GetVentasTotalesPorTurnoAsync(
            Guid tenantId, 
            DateTime fechaInicio, 
            DateTime? fechaFin)
        {
            // 1. Asegurar DateTimeKind.Utc para PostgreSQL
            var fechaDesde = DateTime.SpecifyKind(fechaInicio, DateTimeKind.Utc);
            var fechaHasta = DateTime.SpecifyKind(fechaFin ?? DateTime.UtcNow, DateTimeKind.Utc);
        
            // 2. Consultar directamente agrupando por el Enum PaymentMethod
            var ventas = await _context.Sales
                .AsNoTracking()
                .Where(s => s.TenantId == tenantId && s.CreatedAt >= fechaDesde && s.CreatedAt <= fechaHasta)
                .Select(s => new { s.PaymentMethod, s.Total })
                .ToListAsync();
        
            // 3. Sumar comparando directamente contra los valores del enum PaymentMethod
            decimal efectivo = ventas
                .Where(v => v.PaymentMethod == PaymentMethod.Efectivo)
                .Sum(v => v.Total);
        
            // Mapeamos 'Transferencia' a la bolsa de MercadoPago/Transferencias
            decimal mercadoPago = ventas
                .Where(v => v.PaymentMethod == PaymentMethod.Transferencia)
                .Sum(v => v.Total);
        
            // Mapeamos Débito y Crédito a la bolsa de Tarjeta
            decimal tarjeta = ventas
                .Where(v => v.PaymentMethod == PaymentMethod.TarjetaDebito || 
                            v.PaymentMethod == PaymentMethod.TarjetaCredito)
                .Sum(v => v.Total);
        
            return (efectivo, mercadoPago, tarjeta);
        }
    }