using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using Infraestructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Application.Services
{
    public class SaleService : ISaleService
    {
        private readonly ISaleRepository _saleRepository;
        private readonly IProductRepository _productRepository;
        private readonly ICajaService _cajaService;

        public SaleService(ISaleRepository saleRepository, IProductRepository productRepository, ICajaService cajaService)
        {
            _saleRepository = saleRepository;
            _productRepository = productRepository;
            _cajaService = cajaService;
        }

        // --- 1. HISTORIAL DE VENTAS CON DETALLES ---
        public async Task<IEnumerable<SaleHistoryDto>> GetSalesHistoryAsync(Guid tenantId){
            var sales = await _saleRepository.GetSalesWithDetailsAsync(tenantId, new DateTime(2000, 1, 1));
            var argentinaZone = TimeZoneInfo.FindSystemTimeZoneById("America/Argentina/Buenos_Aires");
        
            return sales.Select(sale => {
                var utcDate = DateTime.SpecifyKind(sale.CreatedAt, DateTimeKind.Utc);
                return new SaleHistoryDto{
                    Id = sale.Id,
                    CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(utcDate, argentinaZone),
                    Total = sale.Total,
                    Items = sale.Details.Select(d => new SaleDetailDto{
                        Id = d.Id,
                        ProductId = d.ProductId,
                        ProductName = d.Product?.Name ?? "Producto no disponible",
                        ProductBarcode = d.Product?.Barcode ?? string.Empty,
                        CategoryName = d.Product != null ? d.Product.Categoria.ToString() : "Otros", // <--- Mapeo del Enum
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice
                    }).ToList()
                };
            }).ToList();
        }

        // --- 2. REGISTRO DE VENTAS ---
        public async Task<Guid> CreateSaleAsync(Guid tenantId, CreateSaleDto dto)
        {
            if (dto.Items == null || !dto.Items.Any())
                throw new ArgumentException("La venta debe contener artículos.");
        
            await _saleRepository.BeginTransactionAsync();
        
            try
            {
                var nuevaVenta = new Sale
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    CreatedAt = DateTime.UtcNow,
                    Total = 0,
                    PaymentMethod = dto.PaymentMethod 
                };
        
                decimal acumuladorTotal = 0;
        
                foreach (var item in dto.Items)
                {
                    var producto = await _productRepository.GetByIdAsync(item.ProductId);
        
                    if (producto == null)
                        throw new Exception($"El producto no pertenece a tu inventario.");
        
                    if (producto.Stock < item.Quantity)
                        throw new Exception($"Stock insuficiente para '{producto.Name}'.");
        
                    producto.Stock -= item.Quantity;
                    _productRepository.Update(producto);
        
                    var detalle = new SaleDetail
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        SaleId = nuevaVenta.Id,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    };
        
                    acumuladorTotal += (item.Quantity * item.UnitPrice);
                    nuevaVenta.Details.Add(detalle);
                }
        
                nuevaVenta.Total = acumuladorTotal;
        
                if (nuevaVenta.PaymentMethod == PaymentMethod.Efectivo)
                {
                    if (dto.ReceivedAmount < nuevaVenta.Total)
                        throw new InvalidOperationException($"Monto recibido insuficiente. El total es {nuevaVenta.Total:C} y se recibió {dto.ReceivedAmount:C}.");
        
                    nuevaVenta.ReceivedAmount = dto.ReceivedAmount;
                    nuevaVenta.ChangeAmount = dto.ReceivedAmount - nuevaVenta.Total;
                }
                else
                {
                    nuevaVenta.ReceivedAmount = nuevaVenta.Total;
                    nuevaVenta.ChangeAmount = 0m;
                }
        
                // 1. Guardar la venta primero
                await _saleRepository.AddAsync(nuevaVenta);
                await _saleRepository.SaveChangesAsync();
        
                // 2. Registrar el movimiento en la caja
                var dtoMovimiento = new RegistrarMovimientoDto
                {
                    Tipo = "INGRESO",
                    Monto = nuevaVenta.Total,
                    Concepto = $"Venta realizada ({nuevaVenta.PaymentMethod})", 
                    VentaId = nuevaVenta.Id
                };
        
                await _cajaService.RegistrarMovimientoAsync(tenantId, dtoMovimiento);
        
                // 3. Confirmar la transacción
                await _saleRepository.CommitTransactionAsync();
        
                return nuevaVenta.Id;
            }
            catch (Exception ex)
            {
                await _saleRepository.RollbackTransactionAsync();
                // Imprimir el error exacto en la consola para saber la causa si vuelve a fallar
                Console.WriteLine($"[ERROR CREATE SALE]: {ex.Message} | Inner: {ex.InnerException?.Message}");
                throw;
            }
        }
  
        // -- OBTENER DETALLES DE UNA VENTA
        public async Task<SaleResponseDto?> GetSaleByIdAsync(Guid tenantId, Guid saleId){
            var sale = await _saleRepository.GetByIdWithDetailsAsync(saleId, tenantId);

            if (sale == null)
                return null;

            TimeZoneInfo argentinaZone;
            try{
                argentinaZone = TimeZoneInfo.FindSystemTimeZoneById("America/Argentina/Buenos_Aires");
            }
            catch (TimeZoneNotFoundException){
                 argentinaZone = TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time");
            }

            var utcDate = DateTime.SpecifyKind(sale.CreatedAt, DateTimeKind.Utc);

            return new SaleResponseDto{
                Id = sale.Id,
                CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(utcDate, argentinaZone),
                Total = sale.Total,
                Items = sale.Details.Select(d => new SaleDetailDto{
                    Id = d.Id,
                    ProductId = d.ProductId,
                    ProductName = d.Product?.Name ?? "Producto no disponible",
                    ProductBarcode = d.Product?.Barcode ?? string.Empty,
                    Quantity = d.Quantity,
                 UnitPrice = d.UnitPrice
                }).ToList()
            };
        }
       
    }
}