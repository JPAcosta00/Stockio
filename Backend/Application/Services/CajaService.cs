using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

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

    public async Task<MovimientoCajaDto> RegistrarMovimientoAsync(Guid tenantId, RegistrarMovimientoDto dto)
    {
        // 1. Obtener la caja activa para el tenant
        var cajaActiva = await _cajaRepository.GetActivaByTenantAsync(tenantId);
        
        if (cajaActiva == null)
        {
            throw new InvalidOperationException("No hay una caja abierta para registrar movimientos.");
        }
    
        // 2. Validar que la caja enviada o activa coincida
        if (dto.CajaId != Guid.Empty && cajaActiva.Id != dto.CajaId)
        {
            throw new InvalidOperationException("La caja especificada no corresponde a la caja activa actual.");
        }
    
        if (dto.Monto <= 0)
        {
            throw new InvalidOperationException("El monto del movimiento debe ser mayor a cero.");
        }
    
        // 3. Crear la entidad MovimientoCaja
        var movimiento = new MovimientoCaja{
            Id = Guid.NewGuid(),
            CajaId = cajaActiva.Id,
            Tipo = dto.Tipo.ToUpper(), // "INGRESO" o "EGRESO"
            Monto = dto.Monto,
            Concepto = dto.Concepto,
            Fecha = DateTime.UtcNow
        };
    
        // 4. Registrar en el repositorio
        await _cajaRepository.AddMovimientoAsync(movimiento);
    
        // 5. Retornar el DTO mapeado
        return new MovimientoCajaDto
        {
            Id = movimiento.Id,
            Tipo = movimiento.Tipo,
            Monto = movimiento.Monto,
            Concepto = movimiento.Concepto,
            Fecha = movimiento.Fecha
        };
    }

    public async Task<byte[]> GenerarReporteCajaPdfAsync(Guid tenantId)
    {
        QuestPDF.Settings.License = LicenseType.Community;
    
        // 1. Obtener la caja activa/última y sus movimientos desde tu DB
        var cajaActual = await _cajaRepository.GetCajaActivaWithMovimientosAsync(tenantId);
    
        // Cálculos de totales utilizando MovimientoCajaDto (Tipo como string)
        decimal ingresos = cajaActual?.Movimientos?
            .Where(m => string.Equals(m.Tipo, "Ingreso", StringComparison.OrdinalIgnoreCase) || 
                        string.Equals(m.Tipo, "INGRESO", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto) ?? 0m;

        decimal egresos = cajaActual?.Movimientos?
            .Where(m => string.Equals(m.Tipo, "Egreso", StringComparison.OrdinalIgnoreCase) || 
                        string.Equals(m.Tipo, "EGRESO", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto) ?? 0m;

        decimal saldoInicial = cajaActual?.MontoInicial ?? 0m;
        decimal saldoFinal = saldoInicial + ingresos - egresos;
    
        // 2. Generar el documento PDF
        var pdfBytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10));
    
                // Encabezado
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("REPORTE DE CAJA DIARIA").FontSize(18).Bold().FontColor("#10b981");
                        col.Item().Text($"Fecha de impresión: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Darken1);
                    });
                });
    
                // Contenido Principal
                page.Content().PaddingVertical(1, Unit.Centimetre).Column(col =>
                {
                    col.Spacing(15);
    
                    // Tarjetas / Cuadro Resumen de Totales
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });
    
                        table.Cell().Background("#f4f4f5").Padding(8).Column(c => {
                            c.Item().Text("Saldo Inicial").FontSize(9).FontColor(Colors.Grey.Darken2);
                            c.Item().Text($"$ {saldoInicial:N2}").Bold();
                        });
                        table.Cell().Background("#f4f4f5").Padding(8).Column(c => {
                            c.Item().Text("Ingresos").FontSize(9).FontColor(Colors.Grey.Darken2);
                            c.Item().Text($"$ {ingresos:N2}").Bold().FontColor(Colors.Green.Medium);
                        });
                        table.Cell().Background("#f4f4f5").Padding(8).Column(c => {
                            c.Item().Text("Egresos").FontSize(9).FontColor(Colors.Grey.Darken2);
                            c.Item().Text($"$ {egresos:N2}").Bold().FontColor(Colors.Red.Medium);
                        });
                        table.Cell().Background("#e4e4e7").Padding(8).Column(c => {
                            c.Item().Text("Saldo Final").FontSize(9).FontColor(Colors.Grey.Darken2);
                            c.Item().Text($"$ {saldoFinal:N2}").Bold();
                        });
                    });
    
                    col.Item().Text("Detalle de Movimientos").FontSize(12).Bold();
    
                    // Tabla Detallada de Movimientos
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(60);  // Hora
                            columns.RelativeColumn(3);  // Concepto / Descripción
                            columns.RelativeColumn(1);  // Tipo
                            columns.RelativeColumn(1);  // Monto
                        });
    
                        // Cabecera
                        table.Header(header =>
                        {
                            header.Cell().Background("#18181b").Padding(5).Text("Hora").Bold().FontColor(Colors.White);
                            header.Cell().Background("#18181b").Padding(5).Text("Concepto").Bold().FontColor(Colors.White);
                            header.Cell().Background("#18181b").Padding(5).Text("Tipo").Bold().FontColor(Colors.White);
                            header.Cell().Background("#18181b").Padding(5).AlignRight().Text("Monto").Bold().FontColor(Colors.White);
                        });
    
                        // Filas Dinámicas desde la DB
                        if (cajaActual?.Movimientos != null && cajaActual.Movimientos.Any())
                        {
                            foreach (var item in cajaActual.Movimientos)
                            {
                                // Comparación segura como cadena de texto
                                bool esIngreso = string.Equals(item.Tipo, "Ingreso", StringComparison.OrdinalIgnoreCase) || 
                                                 string.Equals(item.Tipo, "INGRESO", StringComparison.OrdinalIgnoreCase);
                        
                                table.Cell().BorderBottom(1).BorderColor("#e4e4e7").Padding(5).Text(item.Fecha.ToString("HH:mm"));
                                table.Cell().BorderBottom(1).BorderColor("#e4e4e7").Padding(5).Text(item.Concepto ?? "-");
                                table.Cell().BorderBottom(1).BorderColor("#e4e4e7").Padding(5).Text(item.Tipo); // Ya es string, no necesita .ToString()
                                table.Cell().BorderBottom(1).BorderColor("#e4e4e7").Padding(5).AlignRight()
                                    .Text($"$ {item.Monto:N2}")
                                    .FontColor(esIngreso ? Colors.Green.Medium : Colors.Red.Medium);
                            }
                        }
                        else
                        {
                            table.Cell().ColumnSpan(4).Padding(15).AlignCenter().Text("No se registraron movimientos en esta caja.");
                        }
                    });
                });
    
                // Pie de página
                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Página ");
                    x.CurrentPageNumber();
                });
            });
        }).GeneratePdf();
    
        return pdfBytes;
    }
    
    // --- MÉTODOS PRIVADOS AUXILIARES ---

    private static CajaActivaResponseDto MapearACajaActivaDto(Caja caja, decimal ventasEfectivo, decimal ventasMercadoPago, decimal ventasTarjeta){
        decimal ingresosExtra = caja.Movimientos?
            .Where(m => string.Equals(m.Tipo, "INGRESO", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto) ?? 0;

        decimal egresosExtra = caja.Movimientos?
            .Where(m => string.Equals(m.Tipo, "EGRESO", StringComparison.OrdinalIgnoreCase))
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