using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services;

public class CajaService : ICajaService
{
    private readonly ICajaRepository _cajaRepository;

    public CajaService(ICajaRepository cajaRepository)
    {
        _cajaRepository = cajaRepository;
    }

    public async Task<CajaActivaResponseDto?> ObtenerCajaActivaAsync(Guid tenantId)
    {
        // 1. Obtener la caja abierta con sus movimientos cargados
        var cajaActiva = await _cajaRepository.GetActivaByTenantAsync(tenantId);
        if (cajaActiva == null)
            return null;

        // 2. Consultar las ventas agrupadas por método de pago desde el repositorio
        var (efectivo, mercadoPago, tarjeta) = await _cajaRepository
            .GetVentasTotalesPorTurnoAsync(tenantId, cajaActiva.FechaApertura, DateTime.UtcNow);

        // 3. Mapear y construir el DTO de respuesta
        return MapearACajaActivaDto(cajaActiva, efectivo, mercadoPago, tarjeta);
    }

    public async Task<CajaActivaResponseDto> AbrirCajaAsync(Guid tenantId, Guid usuarioId, decimal montoInicial)
    {
        // Validar que no exista una caja abierta activa para este Tenant
        var cajaExistente = await _cajaRepository.GetActivaByTenantAsync(tenantId);
        if (cajaExistente != null)
        {
            throw new InvalidOperationException("Ya existe una caja abierta para este negocio.");
        }

        if (montoInicial < 0)
        {
            throw new InvalidOperationException("El monto inicial no puede ser negativo.");
        }

        // Crear la entidad Caja
        var nuevaCaja = new Caja
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UsuarioId = usuarioId,
            IsOpen = true,
            MontoInicial = montoInicial,
            FechaApertura = DateTime.UtcNow,
            Movimientos = new List<MovimientoCaja>()
        };

        await _cajaRepository.AddAsync(nuevaCaja);
        await _cajaRepository.SaveChangesAsync();

        return MapearACajaActivaDto(nuevaCaja, 0, 0, 0);
    }

    public async Task<CajaHistorialDto> CerrarCajaAsync(Guid tenantId, Guid usuarioId, CerrarCajaDto datosDeCierre)
    {
       // Buscar la caja por ID y TenantId con sus movimientos
       var caja = await _cajaRepository.GetByIdWithMovimientosAsync(datosDeCierre.CajaId, tenantId);
       if (caja == null)
       {
           throw new KeyNotFoundException("No se encontró la caja especificada.");
       }

       if (!caja.IsOpen)
       {
           throw new InvalidOperationException("La caja ya se encuentra cerrada.");
       }

       var fechaCierre = DateTime.UtcNow;

       // Obtener el acumulado de ventas del periodo mediante el método del repositorio
       var (ventasEfectivo, ventasMercadoPago, ventasTarjeta) = await _cajaRepository
           .GetVentasTotalesPorTurnoAsync(tenantId, caja.FechaApertura, fechaCierre);

       // Calcular ingresos y egresos extra desde la colección de Movimientos
       decimal ingresosExtra = caja.Movimientos?
           .Where(m => string.Equals(m.Tipo, "Ingreso", StringComparison.OrdinalIgnoreCase))
           .Sum(m => m.Monto) ?? 0;

       decimal egresosExtra = caja.Movimientos?
           .Where(m => string.Equals(m.Tipo, "Egreso", StringComparison.OrdinalIgnoreCase))
           .Sum(m => m.Monto) ?? 0;

       // Calcular el efectivo esperado y las diferencias del arqueo
       decimal efectivoEsperado = caja.MontoInicial + ventasEfectivo + ingresosExtra - egresosExtra;
       decimal totalVendido = ventasEfectivo + ventasMercadoPago + ventasTarjeta;
       decimal diferencia = datosDeCierre.EfectivoRealContado - efectivoEsperado;

       // Actualizar el estado de la entidad Caja
       caja.IsOpen = false;
       caja.FechaCierre = fechaCierre;
       
       // Asignar totales
       caja.VentasEfectivo = ventasEfectivo;
       caja.VentasMercadoPago = ventasMercadoPago;
       caja.VentasTarjeta = ventasTarjeta;
       caja.MontoIngresosExtra = ingresosExtra;
       caja.MontoEgresosExtra = egresosExtra;

       caja.EfectivoRealContado = datosDeCierre.EfectivoRealContado;
       caja.EfectivoEsperado = efectivoEsperado;
       caja.Diferencia = diferencia;
       caja.Observaciones = datosDeCierre.Observaciones;

       _cajaRepository.Update(caja);
       await _cajaRepository.SaveChangesAsync();

       // Retorna el DTO con el resumen de cierrre
       return new CajaHistorialDto
       {
           Id = caja.Id,
           FechaApertura = caja.FechaApertura,
           FechaCierre = fechaCierre,
           MontoInicial = caja.MontoInicial,
           VentasEfectivo = caja.VentasEfectivo,
           VentasMercadoPago = caja.VentasMercadoPago,
           VentasTarjeta = caja.VentasTarjeta,
           TotalVendido = totalVendido,
           EfectivoEsperado = caja.EfectivoEsperado,
           EfectivoRealContado = caja.EfectivoRealContado,
           Diferencia = caja.Diferencia,
           Observaciones = caja.Observaciones
       };
    }

    // --- MÉTODOS PRIVADOS AUXILIARES ---

    private static CajaActivaResponseDto MapearACajaActivaDto(Caja caja, decimal ventasEfectivo, decimal ventasMercadoPago, decimal ventasTarjeta){
        decimal ingresosExtra = caja.Movimientos?
            .Where(m => string.Equals(m.Tipo, "Ingreso", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto) ?? 0;

        decimal egresosExtra = caja.Movimientos?
            .Where(m => string.Equals(m.Tipo, "Egreso", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto) ?? 0;

        decimal efectivoEsperado = caja.MontoInicial + ventasEfectivo + ingresosExtra - egresosExtra;

        return new CajaActivaResponseDto
        {
            Id = caja.Id,
            TenantId = caja.TenantId,
            UsuarioId = caja.UsuarioId.ToString(),
            IsOpen = caja.IsOpen,
            MontoInicial = caja.MontoInicial,
            FechaApertura = caja.FechaApertura,
            VentasEfectivo = ventasEfectivo,
            VentasMercadoPago = ventasMercadoPago,
            VentasTarjeta = ventasTarjeta,
            MontoIngresosExtra = ingresosExtra,
            MontoEgresosExtra = egresosExtra,
            EfectivoEsperado = efectivoEsperado,
            Movimientos = caja.Movimientos?.Select(m => new MovimientoCajaDto
            {
                Id = m.Id,
                Tipo = m.Tipo,
                Monto = m.Monto,
                Concepto = m.Concepto,
                Fecha = m.Fecha
            }).ToList() ?? new List<MovimientoCajaDto>()
        };
    }
}