using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Text.RegularExpressions;

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

        if (dto.Monto <= 0)
        {
            throw new InvalidOperationException("El monto del movimiento debe ser mayor a cero.");
        }

        // 2. Crear la entidad MovimientoCaja
        var movimiento = new MovimientoCaja
        {
            CajaId = cajaActiva.Id, 
            Tipo = dto.Tipo.ToUpper(),
            Monto = dto.Monto,
            Concepto = dto.Concepto,
            Fecha = DateTime.UtcNow,
            VentaId = dto.VentaId
        };

        // 3. Registrar en el repositorio
        await _cajaRepository.AddMovimientoAsync(movimiento);

        await _cajaRepository.SaveChangesAsync();

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

        // 1. Obtener la caja activa desde la BD
        var cajaActual = await _cajaRepository.GetCajaActivaWithMovimientosAsync(tenantId);

        // Mapeo seguro de Entidad a DTO
        var movimientos = cajaActual?.Movimientos?
            .Select(m => new MovimientoCajaDto
            {
                Fecha = m.Fecha,
                Concepto = m.Concepto,
                Tipo = m.Tipo?.ToString() ?? string.Empty,
                Monto = m.Monto
            })
            .ToList() ?? new List<MovimientoCajaDto>();

        // Ajuste de Hora Local
        TimeZoneInfo timeZoneInfo;
        try
        {
            timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById("America/Argentina/Buenos_Aires");
        }
        var fechaImpresionLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZoneInfo);

        // 2. Cálculos de Totales
        decimal ingresos = movimientos
            .Where(m => string.Equals(m.Tipo, "Ingreso", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto);

        decimal egresos = movimientos
            .Where(m => string.Equals(m.Tipo, "Egreso", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto);

        decimal saldoInicial = cajaActual?.MontoInicial ?? 0m;
        decimal saldoFinal = saldoInicial + ingresos - egresos;

        // Extracción exacta del medio de pago entre paréntesis "(MedioPago)"
        string ExtraerMedioPago(string concepto)
        {
            if (string.IsNullOrWhiteSpace(concepto)) return "Efectivo / Otro";

            var match = Regex.Match(concepto, @"\(([^)]+)\)");
            if (match.Success)
            {
                return match.Groups[1].Value.Trim(); // Extrae "TarjetaDebito", "Efectivo", etc.
            }

            return "Efectivo / Otro";
        }

        // Desglose de Ingresos agrupado por el valor extraído del paréntesis
        var ingresosPorMedioPago = movimientos
            .Where(m => string.Equals(m.Tipo, "Ingreso", StringComparison.OrdinalIgnoreCase))
            .GroupBy(m => ExtraerMedioPago(m.Concepto))
            .Select(g => new { MedioPago = g.Key, Monto = g.Sum(m => m.Monto) })
            .OrderByDescending(x => x.Monto)
            .ToList();

        // 3. Generación del Documento PDF
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(9.5f).FontFamily("Arial"));

                // Encabezado
                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("REPORTE DE CAJA DIARIA")
                                .FontSize(20)
                                .ExtraBold()
                                .FontColor("#0f172a");

                            c.Item().Text($"Fecha de impresión: {fechaImpresionLocal:dd/MM/yyyy HH:mm} hs")
                                .FontSize(8.5f)
                                .FontColor(Colors.Grey.Darken1);
                        });

                        row.ConstantItem(100).AlignRight().Container()
                            .Background("#e0f2fe")
                            .PaddingVertical(4)
                            .PaddingHorizontal(8)
                            .CornerRadius(4)
                            .AlignCenter()
                            .Text("CAJA ACTIVA")
                            .FontSize(8)
                            .Bold()
                            .FontColor("#0369a1");
                    });

                    col.Item().PaddingTop(10).LineHorizontal(1).LineColor("#e2e8f0");
                });

                // Contenido Principal
                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(18);

                    // Cuadro Resumen de Totales
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Cell().PaddingRight(4).Container()
                            .Background("#f8fafc").Border(1).BorderColor("#cbd5e1").CornerRadius(6).Padding(10).Column(c =>
                            {
                                c.Item().Text("Saldo Inicial").FontSize(8).SemiBold().FontColor("#64748b");
                                c.Item().Text($"$ {saldoInicial:N2}").FontSize(12).Bold().FontColor("#1e293b");
                            });

                        table.Cell().PaddingHorizontal(2).Container()
                            .Background("#f0fdf4").Border(1).BorderColor("#bbf7d0").CornerRadius(6).Padding(10).Column(c =>
                            {
                                c.Item().Text("Ingresos Total").FontSize(8).SemiBold().FontColor("#166534");
                                c.Item().Text($"$ {ingresos:N2}").FontSize(12).Bold().FontColor("#15803d");
                            });

                        table.Cell().PaddingHorizontal(2).Container()
                            .Background("#fef2f2").Border(1).BorderColor("#fecaca").CornerRadius(6).Padding(10).Column(c =>
                            {
                                c.Item().Text("Egresos Total").FontSize(8).SemiBold().FontColor("#991b1b");
                                c.Item().Text($"$ {egresos:N2}").FontSize(12).Bold().FontColor("#b91c1c");
                            });

                        table.Cell().PaddingLeft(4).Container()
                            .Background("#f1f5f9").Border(1).BorderColor("#94a3b8").CornerRadius(6).Padding(10).Column(c =>
                            {
                                c.Item().Text("Saldo Final Est.").FontSize(8).SemiBold().FontColor("#334155");
                                c.Item().Text($"$ {saldoFinal:N2}").FontSize(12).ExtraBold().FontColor("#0f172a");
                            });
                    });

                    // Desglose de Ingresos por Medio de Pago
                    if (ingresosPorMedioPago.Any())
                    {
                        col.Item().Column(c =>
                        {
                            c.Item().Text("Desglose de Ingresos por Medio de Pago")
                                .FontSize(11)
                                .Bold()
                                .FontColor("#334155");

                            c.Item().PaddingTop(6).Table(table =>
                            {
                                table.ColumnsDefinition(cols =>
                                {
                                    cols.RelativeColumn(3);
                                    cols.RelativeColumn(1);
                                });

                                foreach (var mp in ingresosPorMedioPago)
                                {
                                    table.Cell().BorderBottom(1).BorderColor("#f1f5f9").Padding(5)
                                        .Text(mp.MedioPago).FontSize(9);

                                    table.Cell().BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight()
                                        .Text($"$ {mp.Monto:N2}").FontSize(9).SemiBold().FontColor("#15803d");
                                }
                            });
                        });
                    }

                    // Detalle de Movimientos
                    col.Item().Column(c =>
                    {
                        c.Item().Text("Detalle de Movimientos")
                            .FontSize(11)
                            .Bold()
                            .FontColor("#334155");

                        c.Item().PaddingTop(6).Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(50);  // Hora
                                columns.RelativeColumn(4);   // Concepto
                                columns.RelativeColumn(1);   // Tipo
                                columns.RelativeColumn(1.5f);// Monto
                            });

                            table.Header(header =>
                            {
                                header.Cell().Background("#0f172a").Padding(6).Text("Hora").Bold().FontColor(Colors.White).FontSize(8.5f);
                                header.Cell().Background("#0f172a").Padding(6).Text("Concepto").Bold().FontColor(Colors.White).FontSize(8.5f);
                                header.Cell().Background("#0f172a").Padding(6).Text("Tipo").Bold().FontColor(Colors.White).FontSize(8.5f);
                                header.Cell().Background("#0f172a").Padding(6).AlignRight().Text("Monto").Bold().FontColor(Colors.White).FontSize(8.5f);
                            });

                            if (movimientos.Any())
                            {
                                for (int i = 0; i < movimientos.Count; i++)
                                {
                                    var item = movimientos[i];
                                    bool esIngreso = string.Equals(item.Tipo, "Ingreso", StringComparison.OrdinalIgnoreCase);
                                    var bgRow = i % 2 == 0 ? "#ffffff" : "#f8fafc";

                                    table.Cell().Background(bgRow).BorderBottom(1).BorderColor("#f1f5f9").Padding(6)
                                        .Text(item.Fecha.ToString("HH:mm")).FontSize(8.5f);

                                    table.Cell().Background(bgRow).BorderBottom(1).BorderColor("#f1f5f9").Padding(6)
                                        .Text(item.Concepto ?? "-").FontSize(8.5f);

                                    table.Cell().Background(bgRow).BorderBottom(1).BorderColor("#f1f5f9").Padding(6)
                                        .Text(item.Tipo).FontSize(8.5f);

                                    table.Cell().Background(bgRow).BorderBottom(1).BorderColor("#f1f5f9").Padding(6).AlignRight()
                                        .Text($"$ {item.Monto:N2}")
                                        .FontSize(8.5f)
                                        .Bold()
                                        .FontColor(esIngreso ? "#15803d" : "#b91c1c");
                                }
                            }
                            else
                            {
                                table.Cell().ColumnSpan(4).Padding(20).AlignCenter()
                                    .Text("No se registraron movimientos en esta caja.")
                                    .FontColor(Colors.Grey.Medium);
                            }
                        });
                    });
                });

                // Pie de Página
                page.Footer().Column(col =>
                {
                    col.Item().LineHorizontal(1).LineColor("#e2e8f0");
                    col.Item().PaddingTop(6).Row(row =>
                    {
                        row.RelativeItem().Text("Sistema de Gestión de Caja")
                            .FontSize(8)
                            .FontColor(Colors.Grey.Darken1);

                        row.RelativeItem().AlignRight().Text(x =>
                        {
                            x.Span("Página ").FontSize(8).FontColor(Colors.Grey.Darken1);
                            x.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Darken1);
                            x.Span(" de ").FontSize(8).FontColor(Colors.Grey.Darken1);
                            x.TotalPages().FontSize(8).FontColor(Colors.Grey.Darken1);
                        });
                    });
                });
            });
        }).GeneratePdf();
    }
    
    // --- MÉTODOS PRIVADOS AUXILIARES ---

    private static CajaActivaResponseDto MapearACajaActivaDto(Caja caja, decimal ventasEfectivo, decimal ventasMercadoPago, decimal ventasTarjeta)
    {
        // Solo sumamos ingresos extra MANUALES (que no provienen de una venta)
        decimal ingresosExtra = caja.Movimientos?
            .Where(m => m.VentaId == null && string.Equals(m.Tipo, "INGRESO", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto) ?? 0;

        // Solo sumamos egresos extra MANUALES
        decimal egresosExtra = caja.Movimientos?
            .Where(m => m.VentaId == null && string.Equals(m.Tipo, "EGRESO", StringComparison.OrdinalIgnoreCase))
            .Sum(m => m.Monto) ?? 0;

        // El efectivo esperado suma únicamente el efectivo real de ventas + los ingresos manuales de caja
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