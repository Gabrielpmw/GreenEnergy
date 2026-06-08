using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GreenEnergy.API.Migrations
{
    /// <inheritdoc />
    public partial class AddObservacaoAndRealCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Observacao",
                table: "Sensores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "CategoriasAparelhos",
                keyColumn: "Id",
                keyValue: 1,
                column: "Descricao",
                value: "Ar condicionado, aquecedores e ventiladores");

            migrationBuilder.UpdateData(
                table: "CategoriasAparelhos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Descricao", "Nome" },
                values: new object[] { "Geladeira, fogão, micro-ondas, freezer e máquina de lavar", "Eletrodomésticos" });

            migrationBuilder.UpdateData(
                table: "CategoriasAparelhos",
                keyColumn: "Id",
                keyValue: 3,
                column: "Descricao",
                value: "Televisão, computador, roteador e consoles de videogame");

            migrationBuilder.InsertData(
                table: "CategoriasAparelhos",
                columns: new[] { "Id", "Descricao", "IconeUrl", "IsActive", "IsDeleted", "Nome" },
                values: new object[,]
                {
                    { 4, "Lâmpadas LED, luminárias e fitas de LED", "lightbulb", true, false, "Iluminação" },
                    { 5, "Carregadores, adaptadores e tomadas inteligentes", "plug", true, false, "Outros / Uso Geral" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "CategoriasAparelhos",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "CategoriasAparelhos",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DropColumn(
                name: "Observacao",
                table: "Sensores");

            migrationBuilder.UpdateData(
                table: "CategoriasAparelhos",
                keyColumn: "Id",
                keyValue: 1,
                column: "Descricao",
                value: "Aparelhos de ar condicionado, ventiladores e aquecedores");

            migrationBuilder.UpdateData(
                table: "CategoriasAparelhos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Descricao", "Nome" },
                values: new object[] { "Geladeiras, freezers, fornos e máquinas de lavar", "Linha Branca" });

            migrationBuilder.UpdateData(
                table: "CategoriasAparelhos",
                keyColumn: "Id",
                keyValue: 3,
                column: "Descricao",
                value: "Computadores, televisores, consoles de videogame e roteadores");
        }
    }
}
