using Application.Interfaces;
using Domain.Entities;
using Infraestructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage; // Necesario para IDbContextTransaction

namespace Infrastructure.Repositories
{
    public class SaleRepository : ISaleRepository
    {
        private readonly ApplicationDbContext _context;

        public SaleRepository(ApplicationDbContext context) => _context = context;

        // ... (tus otros métodos se mantienen igual)

        // MODIFICACIÓN: En lugar de un método void, delegamos la ejecución a la estrategia
        public async Task ExecuteInTransactionAsync(Func<Task> action)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    await action(); // Ejecuta toda la lógica de negocio que le pases
                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });
        }

        // Elimina o deja de usar BeginTransactionAsync, CommitTransactionAsync y RollbackTransactionAsync 
        // manuales si vas a usar el nuevo ExecuteInTransactionAsync.
    }
}