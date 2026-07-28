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

        public SaleService(ISaleRepository saleRepository, IProductRepository productRepository)
        {
            _saleRepository = saleRepository;
            _productRepository = productRepository;
        }

        // --- 1. HISTORIAL DE VENTAS ---
        public async Task<IEnumerable<SaleHistoryDto>> GetSalesHistoryAsync(Guid tenantId){
            var sales = await _saleRepository.GetByTenantAsync(tenantId);
            var argentinaZone = TimeZoneInfo.FindSystemTimeZoneById("America/Argentina/Buenos_Aires");

            return sales.Select(s => new SaleHistoryDto{
                Id = s.Id,
                CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(s.CreatedAt, argentinaZone),
                Total = s.Total
            }).ToList();
        }

        // --- 2. REGISTRO DE VENTAS ---
        public async Task<Guid> CreateSaleAsync(Guid tenantId, CreateSaleDto dto)
        {
            if (dto.Items == null || !dto.Items.Any())
                throw new ArgumentException("La venta debe contener artículos.");

            // La transacción se maneja con el repositorio
            await _saleRepository.BeginTransactionAsync();

            try
            {
                var nuevaVenta = new Sale
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    CreatedAt = DateTime.UtcNow,
                    Total = 0
                };

                decimal acumuladorTotal = 0;

                foreach (var item in dto.Items)
                {
                    var producto = await _productRepository.GetByIdAsync(item.ProductId);

                    if (producto == null)
                        throw new Exception($"El producto no pertenece a tu inventario.");

                    if (producto.Stock < item.Quantity)
                        throw new Exception($"Stock insuficiente para '{producto.Name}'.");

                    // se resta al stock del producto 
                    producto.Stock -= item.Quantity;
                    _productRepository.Update(producto);        //manda a actualizar por el metodo del repo generico

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

                // se guarda la persistencia
                await _saleRepository.AddAsync(nuevaVenta);
                await _saleRepository.SaveChangesAsync();

                await _saleRepository.CommitTransactionAsync();

                return nuevaVenta.Id;
            }
            catch (Exception)
            {
                await _saleRepository.RollbackTransactionAsync();
                throw;
            }
        }
  
        // -- OBTENER DETALLES DE UNA VENTA
        public async Task<SaleResponseDto?> GetSaleByIdAsync(Guid tenantId, Guid saleId){
            var sale = await _saleRepository.GetByIdWithDetailsAsync(tenantId, saleId);

            if (sale == null)
                return null;

            var argentinaZone = TimeZoneInfo.FindSystemTimeZoneById("America/Argentina/Buenos_Aires");

            return new SaleResponseDto{
                Id = sale.Id,
                CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(sale.CreatedAt, argentinaZone),
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
       
        // agregar la baja de venta
    }
}