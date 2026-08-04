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
using QuestPDF.Infrastructure;                  //"infrastructure" xq en la libreria se llama asi


var builder = WebApplication.CreateBuilder(args);

// Obtener la cadena de conexión desde appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 30))));

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "Sistema de Stock", Version = "v1" });

    // Esto le enseña a Swagger cómo manejar el token JWT
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Autenticación JWT. Escribí 'Bearer' seguido de un espacio y tu token. Ejemplo: 'Bearer eyJhbGciOi...'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    // Esto le aplica la seguridad globalmente a todos los endpoints en la interfaz de Swagger
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
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = "SaaSStockAPI", 
        ValidAudience = "SaaSStockReactClient",
        IssuerSigningKey = new SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes("TuClaveSecretaSuperLargaYSeguraQueDebesCambiarEnProduccion"))
    };
});
builder.Services.AddControllers();

//para muchos tenants
builder.Services.AddHttpContextAccessor(); // Requerido para leer los headers/tokens HTTP
// Se inyecta el TenantProvider que lee el JWT. 
builder.Services.AddScoped<ITenantProvider, TenantProvider>();

// --- REPOSITORIOS Y SERVICIOS ---
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenBuilder, JwtTokenBuilder>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductImportService, ProductImportService>();
builder.Services.AddScoped<IProductExportService, ProductExportService>();
builder.Services.AddScoped<ISaleRepository, SaleRepository>();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IInventoryStatsService, InventoryStatsService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICajaRepository, CajaRepository>();

// --- ROBUSTEZ Y VALIDACIONES ---
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails(); 
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<ProductValidator>();

//para activar la licencia de PDF
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()   // Permite cualquier origen (cualquier URL o puerto del Front)
              .AllowAnyHeader()   // Permite cualquier cabecera 
              .AllowAnyMethod();  // Permite GET, POST, PUT, DELETE, etc.
    });
});

var app = builder.Build();

// Agrego el manejo de excepciones 
app.UseExceptionHandler();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseHttpsRedirection();

// los middlewares de seguridad para validar los token
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();