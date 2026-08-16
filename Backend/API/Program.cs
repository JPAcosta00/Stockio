using Application.Services;
using Application.Interfaces;
using Domain.Interfaces;
using Infraestructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Infraestructure.Security;
using API.Middlewares;
using Application.Validators;
using FluentValidation.AspNetCore;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Infraestructure.Services;
using QuestPDF.Infrastructure;
using Infraestructure;
using Resend;
using Microsoft.Extensions.FileProviders; // <-- Necesario para la ruta física del wwwroot

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = Directory.GetCurrentDirectory()
});

builder.Configuration.Sources.Clear();
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: false)
    .AddEnvironmentVariables();

// --- CONFIGURACIÓN DUAL DE BASE DE DATOS (MySQL / SQLite) ---
var dbProvider = builder.Configuration["DatabaseSettings:Provider"] ?? "Sqlite";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (dbProvider.Equals("MySql", StringComparison.OrdinalIgnoreCase))
    {
        var mySqlConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        options.UseMySql(mySqlConnectionString, ServerVersion.AutoDetect(mySqlConnectionString), mySqlOptions => 
        {
            mySqlOptions.EnableRetryOnFailure();
        });
    }
    else
    {
        // Creamos la ruta absoluta y segura en la carpeta de datos del usuario
        var folder = Environment.SpecialFolder.LocalApplicationData;
        var path = Environment.GetFolderPath(folder);
        var dbDirectory = Path.Combine(path, "Stockio");
        
        // Nos aseguramos de que la carpeta física exista
        Directory.CreateDirectory(dbDirectory);
        
        // Usamos el nombre que tenías en tu appsettings ("stockio_offline.db") pero en una ruta con permisos
        var dbPath = Path.Combine(dbDirectory, "stockio_offline.db");
        options.UseSqlite($"Data Source={dbPath}");
    }
});

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "Sistema de Stock", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Autenticación JWT. Escribí 'Bearer' seguido de un espacio y tu token. Ejemplo: 'Bearer eyJhbGciOi...'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = jwtSettings["Issuer"] ?? "SaaSStockAPI", 
        ValidAudience = jwtSettings["Audience"] ?? "SaaSStockReactClient",
        IssuerSigningKey = new SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
    };
});
builder.Services.AddControllers();
// La API no sabe qué base de datos es, solo le pide a Infrastructure que se configure
builder.Services.AddInfrastructureServices(builder.Configuration);
// Para múltiples tenants
builder.Services.AddHttpContextAccessor(); 
builder.Services.AddScoped<ITenantProvider, TenantProvider>();

// --- REPOSITORIOS Y SERVICIOS ---
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddTransient<IJwtTokenBuilder, JwtTokenBuilder>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductImportService, ProductImportService>();
builder.Services.AddScoped<IProductExportService, ProductExportService>();
builder.Services.AddScoped<ISaleRepository, SaleRepository>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IInventoryStatsService, InventoryStatsService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICajaService, CajaService>();
builder.Services.AddScoped<ICajaRepository, CajaRepository>();
builder.Services.AddScoped<IProviderRepository, ProviderRepository>();
builder.Services.AddScoped<IProviderService, ProviderService>();
builder.Services.AddScoped<IPurchaseInvoiceRepository, PurchaseInvoiceRepository>();
builder.Services.AddScoped<IPurchaseInvoiceService, PurchaseInvoiceService>();

// Configuración de Resend
builder.Services.AddTransient<IResend, ResendClient>();
builder.Services.AddHttpClient<ResendClient>();
builder.Services.Configure<ResendClientOptions>(options =>
{
    options.ApiToken = builder.Configuration["ResendSettings:ApiKey"]!;
});
builder.Services.AddScoped<IEmailService, ResendEmailService>();

builder.Services.AddHttpClient();

// --- ROBUSTEZ Y VALIDACIONES ---
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails(); 
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<ProductValidator>();

// Licencia de QuestPDF
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()   
              .AllowAnyHeader()   
              .AllowAnyMethod();  
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // Si usas SQLite y el archivo no existe, creará el archivo y las tablas por ti
    dbContext.Database.EnsureCreated(); 
}

app.UseCors("AllowAll");

app.UseExceptionHandler();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
// Redirige cualquier ruta desconocida al index.html para que React maneje el enrutamiento
app.MapFallbackToFile("index.html");

// --- CONFIGURACIÓN ROBUSTA DE ARCHIVOS ESTÁTICOS Y SPA ---
// Asegura que lea la carpeta wwwroot exactamente donde corre el ejecutable compilado (.exe)
var webRootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
if (Directory.Exists(webRootPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(webRootPath),
        RequestPath = ""
    });
}
else
{
    app.UseStaticFiles(); // Comportamiento por defecto como respaldo
}

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback SPA para el enrutamiento de React (redirige al index.html si no es una ruta de API)
app.MapFallbackToFile("index.html", new StaticFileOptions
{
    FileProvider = Directory.Exists(webRootPath) ? new PhysicalFileProvider(webRootPath) : app.Environment.WebRootFileProvider
});

app.Run();