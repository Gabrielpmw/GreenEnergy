using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenEnergy.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNomeToUnidadeConsumidora : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Nome",
                table: "UnidadesConsumidoras",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Nome",
                table: "UnidadesConsumidoras");
        }
    }
}
