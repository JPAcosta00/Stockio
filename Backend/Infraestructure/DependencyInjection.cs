using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Infraestructure.Data;

namespace Infraestructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            var dbProvider = configuration["DatabaseSettings:Provider"] ?? "Sqlite";

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                if (dbProvider.Equals("MySql", StringComparison.OrdinalIgnoreCase))
                {
                    var conn = configuration.GetConnectionString("DefaultConnection");
                    options.UseMySql(conn, ServerVersion.AutoDetect(conn), mySqlOptions => {
                        mySqlOptions.EnableRetryOnFailure();
                    });
                }
                else
                {
                    var conn = configuration.GetConnectionString("SqliteConnection");
                    options.UseSqlite(conn);
                }
            });

            // Aquí adentro también puedes mover tus AddScoped de repositorios si quieres limpiar más el Program.cs
            return services;
        }
    }
}