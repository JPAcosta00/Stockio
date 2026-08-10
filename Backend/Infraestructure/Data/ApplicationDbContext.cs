using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
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
    public DbSet<Provider> Providers { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleDetail> SaleDetails { get; set; }
    public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
    public DbSet<PurchaseInvoiceDetail> PurchaseInvoiceDetails { get; set; }
    public DbSet<Caja> Cajas { get; set; } = null!;
    public DbSet<MovimientoCaja> MovimientosCaja { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =========================================================================
        // 1. CONVENCIÓN GLOBAL DE TIPOS (Mapeo automático de Guid a char(36))
        // =========================================================================
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(Guid) || property.ClrType == typeof(Guid?))
                {
                    property.SetColumnType("char(36)");
                }
            }
        }

        // =========================================================================
        // 2. CONFIGURACIÓN Y MAPEO DE ENTIDADES 
        // =========================================================================

        // Tenant
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Name).IsRequired().HasMaxLength(100);
        });

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(u => u.ResetToken).HasMaxLength(256).IsRequired(false);
            entity.Property(u => u.ResetTokenExpires).IsRequired(false);

            entity.HasIndex(u => u.ResetToken);

            entity.HasOne(u => u.Tenant)
                  .WithMany(t => t.Users)
                  .HasForeignKey(u => u.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(p => p.Id);

            // Configuramos la relación con Tenant para que no invente columnas raras
            entity.HasOne(p => p.Tenant)
                  .WithMany(t => t.Products)
                  .HasForeignKey(p => p.TenantId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Configuracion de la categoria
            entity.Property(p => p.Categoria)
                  .HasConversion<string>()
                  .HasMaxLength(50)
                  .HasDefaultValue(ProductCategory.Otros)
                  .IsRequired();
        });

        // Provider
        modelBuilder.Entity<Provider>(entity =>
        {
            entity.ToTable("providers");
            entity.HasKey(p => p.Id);
            
            entity.Property(p => p.Name).IsRequired().HasMaxLength(150);
            entity.Property(p => p.AccountBalance).HasPrecision(18, 2);
    
            entity.HasOne(p => p.Tenant)
                  .WithMany(t => t.Providers)
                  .HasForeignKey(p => p.TenantId)
                  .OnDelete(DeleteBehavior.Cascade);
    
            entity.HasIndex(p => new { p.TenantId, p.Name });
        });

        // Configuración para PurchaseInvoice
        modelBuilder.Entity<PurchaseInvoice>(entity =>
        {
            entity.ToTable("purchaseinvoices"); 
            entity.HasKey(e => e.Id);

            entity.Property(e => e.InvoiceNumber)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.TotalAmount)
                .HasColumnType("decimal(18,2)");

            entity.Property(e => e.PaidAmount)
                .HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Provider)
                .WithMany(p => p.PurchaseInvoices)
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.TenantId);
        });

        
       modelBuilder.Entity<PurchaseInvoiceDetail>(entity =>
        {
            entity.ToTable("purchaseinvoicedetails");
            entity.HasKey(d => d.Id);

            entity.Property(d => d.UnitPrice)
                .HasPrecision(18, 2);

            // Forzar utf8mb4_0900_ai_ci en todas las columnas de esta tabla
            entity.Property(d => d.Id)
                .HasColumnType("char(36)")
                .HasCharSet("utf8mb4")
                .UseCollation("utf8mb4_0900_ai_ci");

            entity.Property(d => d.PurchaseInvoiceId)
                .HasColumnType("char(36)")
                .HasCharSet("utf8mb4")
                .UseCollation("utf8mb4_0900_ai_ci");

            entity.Property(d => d.ProductId)
                .HasColumnType("char(36)")
                .HasCharSet("utf8mb4")
                .UseCollation("utf8mb4_0900_ai_ci");

            // Relaciones
            entity.HasOne(d => d.PurchaseInvoice)
                .WithMany(p => p.Details)
                .HasForeignKey(d => d.PurchaseInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Product)
                .WithMany()
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // Caja
        modelBuilder.Entity<Caja>(entity =>
        {
            entity.ToTable("cajas");
            entity.HasKey(c => c.Id);

            entity.HasIndex(c => new { c.TenantId, c.IsOpen });

            entity.Property(c => c.MontoInicial).HasPrecision(18, 2);
            entity.Property(c => c.VentasEfectivo).HasPrecision(18, 2);
            entity.Property(c => c.VentasMercadoPago).HasPrecision(18, 2);
            entity.Property(c => c.VentasTarjeta).HasPrecision(18, 2);
            entity.Property(c => c.MontoIngresosExtra).HasPrecision(18, 2);
            entity.Property(c => c.MontoEgresosExtra).HasPrecision(18, 2);
            entity.Property(c => c.EfectivoEsperado).HasPrecision(18, 2);
            entity.Property(c => c.EfectivoRealContado).HasPrecision(18, 2);
            entity.Property(c => c.Diferencia).HasPrecision(18, 2);
        });

        // MovimientoCaja
        modelBuilder.Entity<MovimientoCaja>(entity => {
            entity.ToTable("movimientos_caja");
            entity.HasKey(m => m.Id);

            entity.Property(m => m.Id)
                  .HasColumnType("char(36)");

            entity.Property(m => m.CajaId)
                  .HasColumnType("char(36)");

            entity.Property(m => m.VentaId)
                  .HasColumnType("char(36)")
                  .IsRequired(false);

            entity.Property(m => m.Monto).HasPrecision(18, 2);
            entity.Property(m => m.Tipo).HasMaxLength(10);
            entity.Property(m => m.Concepto).HasMaxLength(250);

            entity.HasOne(m => m.Caja)
                  .WithMany(c => c.Movimientos)
                  .HasForeignKey(m => m.CajaId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Sale>()
                  .WithMany()
                  .HasForeignKey(m => m.VentaId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Sale
        modelBuilder.Entity<Sale>(entity =>
        {
            entity.ToTable("sales");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Total).HasPrecision(18, 2);
            entity.Property(s => s.PaymentMethod).HasConversion<string>();
        });

        // SaleDetail
        modelBuilder.Entity<SaleDetail>(entity =>
        {
            entity.ToTable("saledetails");
            entity.HasKey(sd => sd.Id);
            entity.Property(sd => sd.UnitPrice).HasPrecision(18, 2);

            entity.HasOne(sd => sd.Sale)
                  .WithMany(s => s.Details)
                  .HasForeignKey(sd => sd.SaleId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sd => sd.Product)
                  .WithMany()
                  .HasForeignKey(sd => sd.ProductId)
                  .OnDelete(DeleteBehavior.Restrict)
                  .IsRequired(false);
        });

        // =========================================================================
        // 3. FILTRO DE CONSULTA MULTITENANT
        // =========================================================================
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IMustHaveTenant).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(CreateTenantFilterExpression(entityType.ClrType));
            }
        }
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