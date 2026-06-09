using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenEnergy.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRelatorioTecnicoAndAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Conteudo",
                table: "RelatoriosTecnicos",
                newName: "SolucaoRecomendada");

            migrationBuilder.AddColumn<string>(
                name: "Descricao",
                table: "RelatoriosTecnicos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Descricao",
                table: "RelatoriosTecnicos");

            migrationBuilder.RenameColumn(
                name: "SolucaoRecomendada",
                table: "RelatoriosTecnicos",
                newName: "Conteudo");
        }
    }
}
