using System.Linq.Expressions;

namespace Domain.Interfaces;

public interface IGenericRepository<T> where T : class
{
    // Obtener todos los registros, pero filtrados por el Tenant actual
    Task<IEnumerable<T>> GetAllAsync(Expression<Func<T, bool>>? predicate = null, bool ignoreQueryFilters = false);
    
    // Obtener un registro específico por su ID
    Task<T?> GetByIdAsync(Guid id);
    
    // Agregar un nuevo registro (Alta)
    Task AddAsync(T entity);
    
    // Actualizar un registro existente (Modificación)
    void Update(T entity);
    
    // Eliminar un registro (Baja lógica o física)
    void Delete(T entity);
    
    // Guardar los cambios en la base de datos
    Task<bool> SaveChangesAsync();
}