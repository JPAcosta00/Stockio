using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

[Authorize] // Opcional: para que solo usuarios logueados puedan descargar el backup
[ApiController]
[Route("api/[controller]")]
public class BackupController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public BackupController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("download")]
    public IActionResult DownloadBackup()
    {
        // 1. Verificamos si estamos usando SQLite
        var dbProvider = _configuration["DatabaseSettings:Provider"] ?? "Sqlite";
        if (!dbProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "El backup local solo está disponible cuando se usa la base de datos offline (SQLite)." });
        }

        // 2. Obtenemos la ruta del archivo de base de datos desde el appsettings
        var connectionString = _configuration.GetConnectionString("SqliteConnection");
        // El connectionString suele ser "Data Source=stockio_offline.db"
        var dbPath = connectionString?.Replace("Data Source=", "").Trim();

        if (string.IsNullOrEmpty(dbPath) || !System.IO.File.Exists(dbPath))
        {
            // Si no se encuentra con ruta relativa, buscamos en la carpeta actual
            dbPath = "stockio_offline.db";
            if (!System.IO.File.Exists(dbPath))
            {
                return NotFound(new { message = "No se encontró el archivo de la base de datos local." });
            }
        }

        // 3. Preparamos el archivo para enviarlo como descarga
        var memory = new MemoryStream();
        using (var stream = new FileStream(dbPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
        {
            stream.CopyTo(memory);
        }
        memory.Position = 0;

        var contentType = "application/x-sqlite3";
        var fileName = $"stockio_backup_{DateTime.Now:yyyyMMdd_HHmmss}.db";

        return File(memory, contentType, fileName);
    }
}