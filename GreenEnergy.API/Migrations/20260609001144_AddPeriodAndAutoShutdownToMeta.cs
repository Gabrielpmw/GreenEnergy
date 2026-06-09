using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenEnergy.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPeriodAndAutoShutdownToMeta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataFim",
                table: "Metas",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataInicio",
                table: "Metas",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "DesligarAoEstourar",
                table: "Metas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DispositivoDesligadoPorMeta",
                table: "Metas",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataFim",
                table: "Metas");

            migrationBuilder.DropColumn(
                name: "DataInicio",
                table: "Metas");

            migrationBuilder.DropColumn(
                name: "DesligarAoEstourar",
                table: "Metas");

            migrationBuilder.DropColumn(
                name: "DispositivoDesligadoPorMeta",
                table: "Metas");
        }
    }
}
