using Domain.Entities;
using Domain.Interfaces;
using Infraestructure.Data;
using Infrastructure.Repositories;

namespace Infrastructure.Repositories;

public class PurchaseInvoiceRepository : GenericRepository<PurchaseInvoice>, IPurchaseInvoiceRepository
{
    public PurchaseInvoiceRepository(ApplicationDbContext context) : base(context)
    {
    }

    // Como hereda de GenericRepository, ya tenés GetAllAsync, GetByIdAsync, AddAsync, Update, Delete y SaveChangesAsync listos para usar.
    // Si necesitás hacer alguna consulta específica que requiera .Include() (como traer el Proveedor), la sumás acá.
}