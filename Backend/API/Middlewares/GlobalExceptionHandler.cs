using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using FluentValidation; 
using System.Net;

namespace API.Middlewares;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var statusCode = (int)HttpStatusCode.InternalServerError;
        var title = "Error Interno del Servidor";
        var detail = "Ocurrió un error inesperado en nuestro sistema. Por favor, intente más tarde.";
        Dictionary<string, string[]>? validationErrors = null;

        // Manejo de errores de validación de datos 
        if (exception is ValidationException validationException)
        {
            statusCode = (int)HttpStatusCode.BadRequest;
            title = "Error de Validación";
            detail = "Uno o más campos no cumplen con las reglas del sistema.";
            
            // Agrupa los errores por el nombre del campo que falló
            validationErrors = validationException.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray()
                );
        }
        // Manejo de accesos no autorizados
        else if (exception is UnauthorizedAccessException)
        {
            statusCode = (int)HttpStatusCode.Unauthorized;
            title = "No Autorizado";
            detail = exception.Message;
        }
        else if (exception is Microsoft.EntityFrameworkCore.DbUpdateException dbUpdateException 
                 && dbUpdateException.InnerException?.Message.Contains("Duplicate entry") == true)
        {
            statusCode = (int)HttpStatusCode.Conflict; 
            title = "Registro Duplicado";
            detail = "El código de barras ya se encuentra registrado para este comercio.";
        }
        // Cualquier otro error inesperado de código o base de datos (MODIFICADO PARA VER EL ERROR REAL)
        else
        {
            _logger.LogError(exception, "Excepción no controlada: {Message}", exception.Message);
            
            // Muestra el error exacto y su InnerException en la respuesta para facilitar la depuración
            detail = exception.Message;
            if (exception.InnerException != null)
            {
                detail += " -> Inner: " + exception.InnerException.Message;
            }
        }

        // Estructura estándar de errores
        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        };

        // Si existen errores de FluentValidation, se inyectan en la respuesta
        if (validationErrors != null)
        {
            problemDetails.Extensions["errors"] = validationErrors;
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}