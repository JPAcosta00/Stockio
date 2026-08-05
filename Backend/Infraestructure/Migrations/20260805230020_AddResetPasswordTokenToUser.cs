using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infraestructure.Migrations
{
    /// <inheritdoc />
    public partial class AddResetPasswordTokenToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ResetToken",
                table: "users",
                type: "varchar(256)",
                maxLength: 256,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ResetTokenExpires",
                table: "users",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "VentaId",
                table: "movimientos_caja",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_ResetToken",
                table: "users",
                column: "ResetToken");

            migrationBuilder.CreateIndex(
                name: "IX_movimientos_caja_VentaId",
                table: "movimientos_caja",
                column: "VentaId");

            migrationBuilder.AddForeignKey(
                name: "FK_movimientos_caja_sales_VentaId",
                table: "movimientos_caja",
                column: "VentaId",
                principalTable: "sales",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_movimientos_caja_sales_VentaId",
                table: "movimientos_caja");

            migrationBuilder.DropIndex(
                name: "IX_users_ResetToken",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_movimientos_caja_VentaId",
                table: "movimientos_caja");

            migrationBuilder.DropColumn(
                name: "ResetToken",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ResetTokenExpires",
                table: "users");

            migrationBuilder.AlterColumn<int>(
                name: "VentaId",
                table: "movimientos_caja",
                type: "int",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");
        }
    }
}
