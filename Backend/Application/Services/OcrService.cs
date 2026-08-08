using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Application.DTOs;
using Application.Interfaces;

public class OcrService : IOcrService
{
    private readonly IProductService _productService;
    private readonly string _tessdataPath;

    public OcrService(IConfiguration configuration, IProductService productService)
    {
        _productService = productService;
        _tessdataPath = Path.Combine(Directory.GetCurrentDirectory(), "tessdata");
    }

    public async Task<OcrResultDto> ProcesarTicketAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("El archivo está vacío o no es válido.");

        string tempFilePath = Path.GetTempFileName();
        using (var stream = new FileStream(tempFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        string textoExtraido = string.Empty;

        try
        {
            using var engine = new TesseractOCR.Engine(_tessdataPath, "spa");
            using var img = TesseractOCR.Pix.Image.LoadFromFile(tempFilePath);
            using var page = engine.Process(img);
            
            textoExtraido = page.Text;
        }
        finally
        {
            if (File.Exists(tempFilePath))
                File.Delete(tempFilePath);
        }

        return ParsearTextoTicket(textoExtraido);
    }

   private OcrResultDto ParsearTextoTicket(string texto)
    {
        var items = new List<OcrItemDto>();
        var lineas = texto.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                          .Select(l => l.Trim())
                          .Where(l => l.Length > 1)
                          .ToList();
    
        // 1. Encontrar las líneas que contienen una secuencia de guiones (ej: "---" o "___")
        var indicesGuiones = new List<int>();
        for (int i = 0; i < lineas.Count; i++)
        {
            if (Regex.IsMatch(lineas[i], @"^[-—_]{3,}$"))
            {
                indicesGuiones.Add(i);
            }
        }
    
        // Si encontramos al menos dos líneas de guiones, el contenido de los productos está estrictamente entre la primera y la segunda
        List<string> lineasProductos = new List<string>();
        if (indicesGuiones.Count >= 2)
        {
            int inicio = indicesGuiones[0] + 1;
            int fin = indicesGuiones[1];
            for (int i = inicio; i < fin; i++)
            {
                lineasProductos.Add(lineas[i]);
            }
        }
        else
        {
            // Fallback por si la foto salió cortada y no detectó los guiones: usamos todas las líneas
            lineasProductos = lineas;
        }
    
        string ultimoProducto = string.Empty;
        decimal ultimoPrecio = 0;
        int ultimaCantidad = 1;
        string ultimoCodigo = string.Empty;
    
        // 2. Procesar únicamente el bloque delimitado de productos
        for (int i = 0; i < lineasProductos.Count; i++)
        {
            string linea = lineasProductos[i];
    
            // Ignorar líneas vacías o de formato puro de cabecera de tabla (ej: "Cant./Precio Unit.")
            if (linea.ToUpper().Contains("CANT") || linea.ToUpper().Contains("DESCRIP") || linea.ToUpper().Contains("IMPORTE"))
                continue;
    
            // Detectar código de barras (8 a 14 dígitos)
            string posibleCodigo = Regex.Replace(linea, @"[^\d]", "");
            if (posibleCodigo.Length >= 8 && posibleCodigo.Length <= 14)
            {
                ultimoCodigo = posibleCodigo;
                if (items.Count > 0 && string.IsNullOrEmpty(items.Last().Barcode))
                {
                    items.Last().Barcode = ultimoCodigo;
                }
                continue;
            }
    
            // Detectar línea de cantidad y precio unitario (ej: "1,00 X 4300,00")
            var matchCantPrecio = Regex.Match(linea, @"^([\d]+[.,][\d]{2})\s*X\s*([\d]+[.,][\d]{2})$", RegexOptions.IgnoreCase);
            if (matchCantPrecio.Success)
            {
                if (int.TryParse(matchCantPrecio.Groups[1].Value.Split(',')[0], out int cant))
                    ultimaCantidad = cant > 0 ? cant : 1;
    
                if (decimal.TryParse(matchCantPrecio.Groups[2].Value.Replace('.', ','), out decimal pUnit))
                    ultimoPrecio = pUnit;
    
                continue;
            }
    
            // Detectar si la línea es un importe suelto (precio final del ítem)
            var matchPrecioSuelto = Regex.Match(linea, @"^([\d]+[.,][\d]{2})$");
            if (matchPrecioSuelto.Success)
            {
                if (decimal.TryParse(matchPrecioSuelto.Groups[1].Value.Replace('.', ','), out decimal p) && p > 0 && p < 100000)
                {
                    if (ultimoPrecio == 0) ultimoPrecio = p;
                }
                continue;
            }
    
            // Si es texto descriptivo, es el nombre del producto
            if (!Regex.IsMatch(linea, @"^[\d\s\.,\-]+$") && !linea.Contains("X"))
            {
                string nombreLimpio = Regex.Replace(linea, @"\s*\(\d+[\.,]\d+\)", "").Trim();
                nombreLimpio = Regex.Replace(nombreLimpio, @"[>—…“”*\-_]", "").Trim();
    
                if (nombreLimpio.Length > 2)
                {
                    // Si ya teníamos un producto anterior listo, lo guardamos
                    if (!string.IsNullOrEmpty(ultimoProducto))
                    {
                        items.Add(new OcrItemDto
                        {
                            Name = ultimoProducto,
                            Stock = ultimaCantidad,
                            Price = ultimoPrecio > 0 ? ultimoPrecio : 0,
                            Barcode = ultimoCodigo
                        });
                        ultimoPrecio = 0;
                        ultimaCantidad = 1;
                        ultimoCodigo = string.Empty;
                    }
    
                    ultimoProducto = nombreLimpio;
                }
            }
    
            // Si ya juntamos nombre y precio, cerramos el ítem
            if (!string.IsNullOrEmpty(ultimoProducto) && ultimoPrecio > 0)
            {
                items.Add(new OcrItemDto
                {
                    Name = ultimoProducto,
                    Stock = ultimaCantidad,
                    Price = ultimoPrecio,
                    Barcode = ultimoCodigo
                });
    
                ultimoProducto = string.Empty;
                ultimoPrecio = 0;
                ultimaCantidad = 1;
                ultimoCodigo = string.Empty;
            }
        }
    
        // Agregar el último si quedó pendiente
        if (!string.IsNullOrEmpty(ultimoProducto))
        {
            items.Add(new OcrItemDto
            {
                Name = ultimoProducto,
                Stock = ultimaCantidad,
                Price = ultimoPrecio,
                Barcode = ultimoCodigo
            });
        }
    
        // Filtrar por seguridad cualquier cosa con precio 0 que se haya colado
        var itemsValidos = items.Where(x => x.Price > 0 && x.Name.Length > 2).ToList();
    
        return new OcrResultDto { Items = itemsValidos.Count > 0 ? itemsValidos : items };
    }
    public async Task ProcesarYGuardarInventarioAsync(IFormFile file, decimal margenGanancia, Guid tenantId)
    {
        var ocrData = await ProcesarTicketAsync(file);

        if (ocrData?.Items == null) return;

        foreach (var item in ocrData.Items)
        {
            decimal precioVentaSugerido = Math.Round(item.Price * (1 + (margenGanancia / 100)), 2);
            string codigoBarras = $"OCR-{Guid.NewGuid().ToString()[..6].ToUpper()}";

            var productosCoincidentes = await _productService.SearchProductsAsync(item.Name, tenantId);
            var productoExistente = productosCoincidentes.FirstOrDefault();

            if (productoExistente != null)
            {
                var updateDto = new UpdateProductDto
                {
                    Name = productoExistente.Name,
                    Barcode = productoExistente.Barcode,
                    Price = precioVentaSugerido > 0 ? precioVentaSugerido : productoExistente.Price,
                    StockActual = productoExistente.Stock + item.Stock,
                    StockMinimum = productoExistente.MinimumStock,
                    Description = productoExistente.Description,
                    State = productoExistente.IsActive,
                    ProviderId = productoExistente.ProviderId
                };

                await _productService.UpdateProductAsync(productoExistente.Id, updateDto);
            }
            else
            {
                var createDto = new ProductCreateDto
                {
                    Barcode = codigoBarras,
                    Name = item.Name,
                    Description = "Ingresado automáticamente vía OCR local",
                    Price = precioVentaSugerido,
                    Stock = item.Stock,
                    MinimumStock = 5,
                    ProviderId = null
                };

                await _productService.CreateProductAsync(createDto, tenantId);
            }
        }
    }
}