using Application.DTOs;

namespace Application.Interfaces;

public interface ICajaService
{
    Task<CajaActivaResponseDto?> ObtenerCajaActivaAsync(Guid tenantId);
    Task<CajaActivaResponseDto> AbrirCajaAsync(Guid tenantId, string usuarioId, decimal montoInicial);
    Task<CajaHistorialDto> CerrarCajaAsync(Guid tenantId, string usuarioId, CerrarCajaDto datosDeCierre);
}