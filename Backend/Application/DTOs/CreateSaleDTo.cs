using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Application.DTOs
{
    public class CreateSaleDto
    {
        [Required]
        public List<CreateSaleItemDto> Items { get; set; } = new List<CreateSaleItemDto>();
        public PaymentMethod PaymentMethod { get; set; }
        public decimal ReceivedAmount { get; set; }
        public decimal ChangeAmount { get; set; }
    }

    public class CreateSaleItemDto
    {
        [Required]
        public Guid ProductId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad mínima debe ser 1.")]
        public int Quantity { get; set; }

        [Required]
        [Range(0.0, double.MaxValue, ErrorMessage = "El precio unitario no puede ser negativo.")]
        public decimal UnitPrice { get; set; }
    }
}