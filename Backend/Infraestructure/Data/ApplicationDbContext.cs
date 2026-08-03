using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Infraestructure.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantProvider tenantProvider) : base(options){
        _tenantProvider = tenantProvider;
    }

    public Guid? CurrentTenantId => _tenantProvider.GetTenantId();
    // tablas de la base de datos
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleDetail> SaleDetails { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder){
         base.OnModelCreating(modelBuilder);

         //configura nombre en minuscula
         modelBuilder.Entity<Tenant>().ToTable("tenants");
         modelBuilder.Entity<User>().ToTable("users");
         modelBuilder.Entity<Product>().ToTable("products");
         modelBuilder.Entity<Sale>().ToTable("sales");
         modelBuilder.Entity<SaleDetail>().ToTable("saledetails");

         modelBuilder.Entity<Tenant>().Property(t => t.Id).HasColumnType("char(36)");
         modelBuilder.Entity<User>().Property(u => u.Id).HasColumnType("char(36)");
         modelBuilder.Entity<User>().Property(u => u.TenantId).HasColumnType("char(36)"); 
         modelBuilder.Entity<Product>().Property(p => p.TenantId).HasColumnType("char(36)");
         modelBuilder.Entity<Product>().Property(p => p.Id).HasColumnType("char(36)");
         modelBuilder.Entity<Sale>().Property(s => s.Id).HasColumnType("char(36)");
         modelBuilder.Entity<Sale>().Property(s => s.TenantId).HasColumnType("char(36)"); // Si Sale implementa IMustHaveTenant

         modelBuilder.Entity<SaleDetail>().Property(sd => sd.Id).HasColumnType("char(36)");
         modelBuilder.Entity<SaleDetail>().Property(sd => sd.SaleId).HasColumnType("char(36)");
         modelBuilder.Entity<SaleDetail>().Property(sd => sd.ProductId).HasColumnType("char(36)");
         modelBuilder.Entity<SaleDetail>().Property(sd => sd.TenantId).HasColumnType("char(36)");

         // Configuración de clave primaria para Tenant
         modelBuilder.Entity<Tenant>(entity =>{
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Name).IsRequired().HasMaxLength(100);
         });

          // Configuración para User
         modelBuilder.Entity<User>(entity =>{
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
        
            // Relación: Un Tenant tiene muchos Usuarios
            entity.HasOne(u => u.Tenant)
              .WithMany(t => t.Users)
              .HasForeignKey(u => u.TenantId)
              .OnDelete(DeleteBehavior.Restrict);
            });

        // Configuración para Product
        modelBuilder.Entity<Product>(entity =>{
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Barcode).IsRequired().HasMaxLength(50);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(150);
            entity.Property(p => p.Price).HasPrecision(18, 2);

        // Relación: Un Tenant tiene muchos Productos
        entity.HasOne(p => p.Tenant)
              .WithMany(t => t.Products)
              .HasForeignKey(p => p.TenantId)
              .OnDelete(DeleteBehavior.Cascade);
              
        // Index de Barcode y TenantId
        entity.HasIndex(p => new { p.TenantId, p.Barcode }).IsUnique();
    });

    //  Ventas y Detalles
    modelBuilder.Entity<Sale>(entity =>
    {
        entity.HasKey(s => s.Id);
        entity.Property(s => s.Total).HasPrecision(18, 2);
        entity.Property(s => s.PaymentMethod).HasConversion<string>();
    });

    modelBuilder.Entity<SaleDetail>(entity =>
    {
        entity.HasKey(sd => sd.Id);
        entity.Property(sd => sd.UnitPrice).HasPrecision(18, 2);


        // Relación: Una venta tiene muchos detalles
        entity.HasOne(sd => sd.Sale)
              .WithMany(s => s.Details)
              .HasForeignKey(sd => sd.SaleId)
              .OnDelete(DeleteBehavior.Cascade);

        // Relación: Un detalle apunta a un producto
        entity.HasOne(sd => sd.Product)
              .WithMany()
              .HasForeignKey(sd => sd.ProductId)
              .OnDelete(DeleteBehavior.Restrict); 
       });
    
       foreach (var entityType in modelBuilder.Model.GetEntityTypes()){
           if (typeof(IMustHaveTenant).IsAssignableFrom(entityType.ClrType)){
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(CreateTenantFilterExpression(entityType.ClrType));
           }
        }

        //-------------------------------- Configuracion del superAdmin ------------------------------
        //  Usuarios y datos base automáticos
         var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

         // Tenant de pruebas
        modelBuilder.Entity<Tenant>().HasData(
             new Tenant { Id = defaultTenantId, Name = "Supermercado Central", IsActive = true, CreatedAt = DateTime.UtcNow }
         );

        // Crea el SuperAdmin
         var passwordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");
         modelBuilder.Entity<User>().HasData(
          new User { 
            Id = Guid.NewGuid(), 
            TenantId = defaultTenantId, 
            Username = "admin", 
            Email = "admin@supercentral.com", 
            PasswordHash = passwordHash, 
            Role = "Admin", 
            IsActive = true 
            }
        );

    }

    // Generador dinámico de expresiones Lambda para armar el "WHERE e.TenantId = actual"
    private LambdaExpression CreateTenantFilterExpression(Type entityType){
         // 1. Creamos el parámetro de la entidad (ej: 'p' para Product)
        var parameter = Expression.Parameter(entityType, "e");

        // 2. Buscamos la propiedad TenantId en la entidad (e.TenantId)
        var property = Expression.Property(parameter, "TenantId");

        // 3. ¡ESTA ES LA CLAVE!: Apuntamos dinámicamente a la propiedad del DbContext
        var dbContextInstance = Expression.Constant(this);
        var tenantIdProperty = Expression.Property(dbContextInstance, nameof(CurrentTenantId));

        var convertedTenantId = Expression.Convert(tenantIdProperty, typeof(Guid));

        // 5. Creamos la comparación usando la versión convertida (e.TenantId == (Guid)DbContext.CurrentTenantId)
        var body = Expression.Equal(property, convertedTenantId);

        // 5. Devolvemos la expresión lambda armada (e => e.TenantId == CurrentTenantId)
        return Expression.Lambda(body, parameter);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default){
        //  TenantId del token JWT mediante el proveedor
        var currentTenantId = _tenantProvider.GetTenantId();

        // Busca todas las entidades nuevas que implementen IMustHaveTenant
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added && e.Entity is IMustHaveTenant);

         foreach (var entry in entries){
            var tenantIdProperty = entry.Entity.GetType().GetProperty("TenantId");
            if (tenantIdProperty != null){
                
                var existingTenantId = (Guid)tenantIdProperty.GetValue(entry.Entity)!;

                if (existingTenantId == Guid.Empty){
                    tenantIdProperty.SetValue(entry.Entity, currentTenantId);
                }  
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}