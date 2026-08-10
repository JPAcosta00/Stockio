public class SaleDetailDto{
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductBarcode { get; set; } = string.Empty;
        public string CategoryName { get; set; } = "Otros";
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal => Quantity * UnitPrice;
}