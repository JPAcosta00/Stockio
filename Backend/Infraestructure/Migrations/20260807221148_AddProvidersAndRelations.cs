using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infraestructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProvidersAndRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Crear la tabla providers sin forzar ascii
            migrationBuilder.CreateTable(
                name: "providers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    TenantId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ContactName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Cuit = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AccountBalance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_providers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_providers_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            // 2. Agregar la columna ProviderId a products sin forzar ascii
            migrationBuilder.AddColumn<Guid>(
                name: "ProviderId",
                table: "products",
                type: "char(36)",
                nullable: true);

            // 3. Crear índices y la llave foránea
            migrationBuilder.CreateIndex(
                name: "IX_providers_TenantId_Name",
                table: "providers",
                columns: new[] { "TenantId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_products_ProviderId",
                table: "products",
                column: "ProviderId");

            migrationBuilder.AddForeignKey(
                name: "FK_products_providers_ProviderId",
                table: "products",
                column: "ProviderId",
                principalTable: "providers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_products_providers_ProviderId",
                table: "products");

            migrationBuilder.DropTable(
                name: "providers");

            migrationBuilder.DropIndex(
                name: "IX_products_ProviderId",
                table: "products");

            migrationBuilder.DropColumn(
                name: "ProviderId",
                table: "products");
        }
    }
}