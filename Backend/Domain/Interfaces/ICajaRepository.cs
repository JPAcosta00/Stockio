using Domain.Entities;

namespace Domain.Interfaces;

public interface ICajaRepository : IGenericRepository<Caja>
    {
        Task<Caja?> GetActivaByTenantAsync(Guid tenantId);
        Task<Caja?> GetByIdWithMovimientosAsync(Guid cajaId, Guid tenantId);
        Task<Caja?> GetCajaActivaWithMovimientosAsync(Guid tenantId);
        Task<IEnumerable<Caja>> GetHistorialByTenantAsync(Guid tenantId, int take = 30);
        Task AddMovimientoAsync(MovimientoCaja movimiento);
        Task<(decimal Efectivo, decimal MercadoPago, decimal Tarjeta)> GetVentasTotalesPorTurnoAsync(Guid tenantId, DateTime fechaInicio, DateTime? fechaFin);
    }