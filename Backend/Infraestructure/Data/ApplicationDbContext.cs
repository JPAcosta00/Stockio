using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Linq.Expressions;

namespace Infraestructure.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantProvider tenantProvider) : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public Guid? CurrentTenantId => _tenantProvider.GetTenantId();

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

        // CONVERSOR GLOBAL PARA GUID <-> STRING (Soluciona el error de InvalidCastException en MySQL)
        var guidConverter = new ValueConverter<Guid, string>(
            v => v.ToString(),
            v => Guid.Parse(v)
        );

        var nullableGuidConverter = new ValueConverter<Guid?, string?>(
            v => v.HasValue ? v.Value.ToString() : null,
            v => string.IsNullOrEmpty(v) ? (Guid?)null : Guid.Parse(v)
        );

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(Guid))
                {
                    property.SetColumnType("varchar(36)");
                    property.SetValueConverter(guidConverter);
                }
                else if (property.ClrType == typeof(Guid?))
                {
                    property.SetColumnType("varchar(36)");
                    property.SetValueConverter(nullableGuidConverter);
                }
            }
        }

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

            entity.HasOne(p => p.Tenant)
                  .WithMany(t => t.Products)
                  .HasForeignKey(p => p.TenantId)
                  .OnDelete(DeleteBehavior.Cascade);
            
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

        // PurchaseInvoice
        modelBuilder.Entity<PurchaseInvoice>(entity =>
        {
            entity.ToTable("purchaseinvoices"); 
            entity.HasKey(e => e.Id);

            entity.Property(e => e.InvoiceNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Provider)
                .WithMany(p => p.PurchaseInvoices)
                .HasForeignKey(e => e.ProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.TenantId);
        });

        // PurchaseInvoiceDetail
        modelBuilder.Entity<PurchaseInvoiceDetail>(entity =>
        {
            entity.ToTable("purchaseinvoicedetails");
            entity.HasKey(d => d.Id);
            entity.Property(d => d.UnitPrice).HasPrecision(18, 2);

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

            entity.Property(m => m.Monto).HasPrecision(18, 2);
            entity.Property(m => m.Tipo).HasMaxLength(10);
            entity.Property(m => m.Concepto).HasMaxLength(250);

            entity.HasOne(m => m.Caja)
                  .WithMany(c => c.Movimientos)
                  .HasForeignKey(m => m.CajaId)
                  .OnDelete(DeleteBehavior.Cascade);
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
        });

        // Filtro Multi-tenant
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(IMustHaveTenant).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(CreateTenantFilterExpression(entityType.ClrType));
            }
        }
    }

    private LambdaExpression CreateTenantFilterExpression(Type entityType)
    {
        var parameter = Expression.Parameter(entityType, "e");
        var currentTenantId = CurrentTenantId;
        var adminTenantId = Guid.Parse("77777777-7777-7777-7777-777777777777");

        if (currentTenantId == null || currentTenantId == adminTenantId)
        {
            return Expression.Lambda(Expression.Constant(true), parameter);
        }

        var property = Expression.Property(parameter, "TenantId");
        var body = Expression.Equal(property, Expression.Constant(currentTenantId));

        return Expression.Lambda(body, parameter);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentTenantId = _tenantProvider.GetTenantId();
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added && e.Entity is IMustHaveTenant);

        foreach (var entry in entries)
        {
            var tenantIdProperty = entry.Entity.GetType().GetProperty("TenantId");
            if (tenantIdProperty != null)
            {
                var val = tenantIdProperty.GetValue(entry.Entity);
                if (val == null || (Guid)val == Guid.Empty)
                {
                    tenantIdProperty.SetValue(entry.Entity, currentTenantId);
                }
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}