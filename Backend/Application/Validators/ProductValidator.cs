using Domain.Entities;
using FluentValidation;

namespace Application.Validators;

public class ProductValidator : AbstractValidator<Product>
{
    public ProductValidator()
    {
        //regla para que el nombre sea valido
        RuleFor(p => p.Name)
            .NotEmpty().WithMessage("El nombre del producto es obligatorio.")
            .MaximumLength(100).WithMessage("El nombre no puede superar los 100 caracteres.");

        //regla para que el codigo de barras no este vacio
        RuleFor(p => p.Barcode)
            .Matches(@"^[0-9]+$").WithMessage("El código de barras solo debe contener números.")
            .Length(8, 14).WithMessage("El código de barras debe tener entre 8 y 14 dígitos (EAN-8 a EAN-14).");

        //regla para que el precio no pueda ser negativo
        RuleFor(p => p.Price)
            .GreaterThan(0).WithMessage("El precio de venta debe ser mayor a cero.");

        //regla para que el stock no pueda ser negativo
        RuleFor(p => p.Stock)
            .GreaterThanOrEqualTo(0).WithMessage("El stock inicial no puede ser negativo.");
    }
}

//los validadores los uso ya que Entity Framework, si se crea un producto con el codigo de barras vacio o el precio en negativo, va 
//intentar dar de alta de todas formas. (se puede romper todo)