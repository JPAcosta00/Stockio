using Application.DTOs;

namespace Application.Interfaces;

public interface ICajaService
{
    Task<CajaActivaResponseDto?> ObtenerCajaActivaAsync(Guid tenantId);
    Task<CajaActivaResponseDto> AbrirCajaAsync(Guid tenantId, Guid usuarioId, decimal montoInicial);
    Task<CajaHistorialDto> CerrarCajaAsync(Guid tenantId, Guid usuarioId, CerrarCajaDto datosDeCierre);

    Task<MovimientoCajaDto> RegistrarMovimientoAsync(Guid tenantId, RegistrarMovimientoDto dto);
}