using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenEnergy.API.Migrations
{
    /// <inheritdoc />
    public partial class MakeSensorDispositivoIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sensores_Dispositivos_DispositivoId",
                table: "Sensores");

            migrationBuilder.DropIndex(
                name: "IX_Sensores_DispositivoId",
                table: "Sensores");

            migrationBuilder.AlterColumn<int>(
                name: "DispositivoId",
                table: "Sensores",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "SenhaHash",
                value: "$2a$11$X7NajVOMby0KhlEqKxX73OZwgyitZql2gVqRenX7VCu03gjsq4lcm");

            migrationBuilder.CreateIndex(
                name: "IX_Sensores_DispositivoId",
                table: "Sensores",
                column: "DispositivoId",
                unique: true,
                filter: "[DispositivoId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Sensores_Dispositivos_DispositivoId",
                table: "Sensores",
                column: "DispositivoId",
                principalTable: "Dispositivos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sensores_Dispositivos_DispositivoId",
                table: "Sensores");

            migrationBuilder.DropIndex(
                name: "IX_Sensores_DispositivoId",
                table: "Sensores");

            migrationBuilder.AlterColumn<int>(
                name: "DispositivoId",
                table: "Sensores",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "SenhaHash",
                value: "$2a$11$N5Uv5jX9oG6c4L54tN3GaeG2t.JkH4mXp.g/lS62PqD8l/lS0G3Nq");

            migrationBuilder.CreateIndex(
                name: "IX_Sensores_DispositivoId",
                table: "Sensores",
                column: "DispositivoId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Sensores_Dispositivos_DispositivoId",
                table: "Sensores",
                column: "DispositivoId",
                principalTable: "Dispositivos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
