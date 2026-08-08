using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Services;

public class PurchaseInvoiceService : IPurchaseInvoiceService
{
    private readonly IPurchaseInvoiceRepository _purchaseInvoiceRepository;
    private readonly IProviderRepository _providerRepository;
    private readonly IProductRepository _productRepository; // Inyectado para actualizar el stock

    public PurchaseInvoiceService(
        IPurchaseInvoiceRepository purchaseInvoiceRepository,
        IProviderRepository providerRepository,
        IProductRepository productRepository)
    {
        _purchaseInvoiceRepository = purchaseInvoiceRepository;
        _providerRepository = providerRepository;
        _productRepository = productRepository;
    }

    public async Task<IEnumerable<PurchaseInvoiceDto>> GetAllAsync(Guid tenantId)
    {
        var invoices = await _purchaseInvoiceRepository.GetAllAsync(x => x.TenantId == tenantId);

        var invoiceDtos = new List<PurchaseInvoiceDto>();

        foreach (var invoice in invoices)
        {
            var provider = await _providerRepository.GetByIdAsync(invoice.ProviderId, tenantId);

            invoiceDtos.Add(new PurchaseInvoiceDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                TotalAmount = invoice.TotalAmount,
                PaidAmount = invoice.PaidAmount,
                InvoiceDate = invoice.InvoiceDate,
                IsPaid = invoice.IsPaid,
                ProviderId = invoice.ProviderId,
                ProviderName = provider?.Name ?? "Desconocido"
            });
        }

        return invoiceDtos;
    }

    public async Task<PurchaseInvoiceDto> CreateAsync(CreatePurchaseInvoiceDto dto, Guid tenantId)
    {
        // 1. Validar que existan ítems en la factura
        if (dto.Details == null || !dto.Details.Any())
        {
            throw new InvalidOperationException("La factura debe contener al menos un producto.");
        }

        // 2. Calcular el monto total basándose en los detalles enviados
        decimal calculatedTotalAmount = dto.Details.Sum(d => d.Quantity * d.UnitPrice);

        if (calculatedTotalAmount <= 0)
        {
            throw new InvalidOperationException("El monto total de la factura debe ser mayor a cero.");
        }

        if (dto.PaidAmount > calculatedTotalAmount)
        {
            throw new InvalidOperationException("El monto pagado no puede ser mayor al monto total.");
        }

        // 3. Verificar proveedor
        var provider = await _providerRepository.GetByIdAsync(dto.ProviderId, tenantId);

        if (provider == null || provider.TenantId != tenantId)
        {
            throw new InvalidOperationException("El proveedor especificado no existe o no pertenece al tenant actual.");
        }

        // 4. Crear la entidad principal de la factura
        var invoiceId = Guid.NewGuid();
        var invoice = new PurchaseInvoice
        {
            Id = invoiceId,
            InvoiceNumber = dto.InvoiceNumber,
            TotalAmount = calculatedTotalAmount,
            PaidAmount = dto.PaidAmount,
            InvoiceDate = dto.InvoiceDate,
            IsPaid = dto.PaidAmount >= calculatedTotalAmount,
            ProviderId = dto.ProviderId,
            TenantId = tenantId,
            Details = new List<PurchaseInvoiceDetail>()
        };

        // 5. Procesar cada detalle: armar relación e impactar Stock
        foreach (var detailDto in dto.Details)
        {
            var product = await _productRepository.GetByIdAsync(detailDto.ProductId);

            if (product == null || product.TenantId != tenantId)
            {
                throw new InvalidOperationException($"El producto con ID {detailDto.ProductId} no existe o no pertenece al tenant.");
            }

            // Agregar el detalle a la factura
            invoice.Details.Add(new PurchaseInvoiceDetail
            {
                Id = Guid.NewGuid(),
                PurchaseInvoiceId = invoiceId,
                ProductId = detailDto.ProductId,
                Quantity = detailDto.Quantity,
                UnitPrice = detailDto.UnitPrice
            });

            // Actualizar stock del producto
            product.Stock += detailDto.Quantity;
            _productRepository.Update(product);
        }

        // 6. Actualizar la cuenta corriente (saldo) del proveedor si quedó deuda pendiente
        if (!invoice.IsPaid)
        {
            decimal pendingDebt = invoice.TotalAmount - invoice.PaidAmount;
            provider.AccountBalance += pendingDebt;
            _providerRepository.Update(provider);
        }

        // 7. Guardar todo mediante el repositorio
        await _purchaseInvoiceRepository.AddAsync(invoice);
        await _purchaseInvoiceRepository.SaveChangesAsync();

        // 8. Retornar DTO mapeado
        return new PurchaseInvoiceDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = invoice.PaidAmount,
            InvoiceDate = invoice.InvoiceDate,
            IsPaid = invoice.IsPaid,
            ProviderId = invoice.ProviderId,
            ProviderName = provider.Name
        };
    }

    public async Task MarkAsPaidAsync(Guid id, Guid tenantId)
    {
        // 1. Buscar la factura verificando el tenant
        var invoice = await _purchaseInvoiceRepository.GetByIdAsync(id);
    
        if (invoice == null || invoice.TenantId != tenantId)
        {
            throw new InvalidOperationException("La factura de compra no existe o no pertenece al tenant actual.");
        }
    
        if (invoice.IsPaid)
        {
            throw new InvalidOperationException("La factura ya se encuentra pagada.");
        }
    
        // 2. Calcular la deuda pendiente que tenía esta factura
        decimal pendingDebt = invoice.TotalAmount - invoice.PaidAmount;
    
        // 3. Actualizar los valores de la factura
        invoice.PaidAmount = invoice.TotalAmount;
        invoice.IsPaid = true;
        _purchaseInvoiceRepository.Update(invoice);
    
        // 4. Buscar al proveedor para descontar de su cuenta corriente (AccountBalance)
        var provider = await _providerRepository.GetByIdAsync(invoice.ProviderId, tenantId);
        if (provider != null)
        {
            provider.AccountBalance -= pendingDebt;
            if (provider.AccountBalance < 0) provider.AccountBalance = 0; // Evitar saldos negativos por redondeo
            _providerRepository.Update(provider);
        }
    
        // 5. Guardar cambios en la base de datos
        await _purchaseInvoiceRepository.SaveChangesAsync();
    }
}