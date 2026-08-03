using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Infraestructure.Migrations
{
    /// <inheritdoc />
    public partial class UnificarTodosLosGuids : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "Id",
                keyValue: new Guid("2cacdc83-a55c-4b81-84af-7e67f9f3dcec"));

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "Id",
                keyValue: new Guid("58612371-92de-4d92-b89b-c0035d53698e"));

            migrationBuilder.DeleteData(
                table: "users",
                keyColumn: "Id",
                keyValue: new Guid("b0a33ffb-394b-4276-8c15-80754637852f"));

            migrationBuilder.InsertData(
                table: "products",
                columns: new[] { "Id", "Barcode", "Description", "IsActive", "MinimumStock", "Name", "Price", "Stock", "TenantId", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("661495ba-611f-4b23-9360-fbbc4aaaa44d"), "7799876543210", "", true, 0, "Azúcar Ledesma 1Kg", 1200.00m, 100, new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 7, 4, 23, 2, 22, 734, DateTimeKind.Utc).AddTicks(7073) },
                    { new Guid("a485c374-5baa-4a1a-b0b3-c824e42e28d8"), "7791234567890", "", true, 0, "Yerba Mate 1Kg", 3500.00m, 50, new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 7, 4, 23, 2, 22, 734, DateTimeKind.Utc).AddTicks(7043) }
                });

            migrationBuilder.UpdateData(
                table: "tenants",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "CreatedAt",
                value: new DateTime(2026, 7, 4, 23, 2, 22, 569, DateTimeKind.Utc).AddTicks(5538));

            migrationBuilder.InsertData(
                table: "users",
                columns: new[] { "Id", "Email", "IsActive", "PasswordHash", "Role", "TenantId", "Username" },
                values: new object[] { new Guid("45e0ff49-a548-4614-86d4-7e0fb2cba388"), "admin@supercentral.com", true, "$2a$11$2E/7WxNZO1p8j34uEMlvmOCHL1MwbjqF6lZaj/deg6jXv6tKRaySG", "Admin", new Guid("11111111-1111-1111-1111-111111111111"), "admin" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "Id",
                keyValue: new Guid("661495ba-611f-4b23-9360-fbbc4aaaa44d"));

            migrationBuilder.DeleteData(
                table: "products",
                keyColumn: "Id",
                keyValue: new Guid("a485c374-5baa-4a1a-b0b3-c824e42e28d8"));

            migrationBuilder.DeleteData(
                table: "users",
                keyColumn: "Id",
                keyValue: new Guid("45e0ff49-a548-4614-86d4-7e0fb2cba388"));

            migrationBuilder.InsertData(
                table: "products",
                columns: new[] { "Id", "Barcode", "Description", "IsActive", "MinimumStock", "Name", "Price", "Stock", "TenantId", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("2cacdc83-a55c-4b81-84af-7e67f9f3dcec"), "7799876543210", "", true, 0, "Azúcar Ledesma 1Kg", 1200.00m, 100, new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 7, 2, 21, 9, 32, 858, DateTimeKind.Utc).AddTicks(547) },
                    { new Guid("58612371-92de-4d92-b89b-c0035d53698e"), "7791234567890", "", true, 0, "Yerba Mate 1Kg", 3500.00m, 50, new Guid("11111111-1111-1111-1111-111111111111"), new DateTime(2026, 7, 2, 21, 9, 32, 858, DateTimeKind.Utc).AddTicks(528) }
                });

            migrationBuilder.UpdateData(
                table: "tenants",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "CreatedAt",
                value: new DateTime(2026, 7, 2, 21, 9, 32, 653, DateTimeKind.Utc).AddTicks(1401));

            migrationBuilder.InsertData(
                table: "users",
                columns: new[] { "Id", "Email", "IsActive", "PasswordHash", "Role", "TenantId", "Username" },
                values: new object[] { new Guid("b0a33ffb-394b-4276-8c15-80754637852f"), "admin@supercentral.com", true, "$2a$11$oNEpfPt.oEqKOJqBY1iaMe10.uSGrAwB7jxvCJh2f0c16.loBIbMW", "Admin", new Guid("11111111-1111-1111-1111-111111111111"), "admin" });
        }
    }
}
