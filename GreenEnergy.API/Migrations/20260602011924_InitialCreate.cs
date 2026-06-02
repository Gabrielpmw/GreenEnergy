using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GreenEnergy.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CachesClima",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CodigoIBGE = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cidade = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TempMin = table.Column<double>(type: "float", nullable: false),
                    TempMax = table.Column<double>(type: "float", nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UmidadePercent = table.Column<double>(type: "float", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CachesClima", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CachesDadosIBGE",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CodigoIBGE = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NomeMunicipio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UF = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PopulacaoEstimada = table.Column<int>(type: "int", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CachesDadosIBGE", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CategoriasAparelhos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IconeUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriasAparelhos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ConfiguracoesAPI",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NomeAPI = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChaveAcesso = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BaseUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracoesAPI", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tarifas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Bandeira = table.Column<int>(type: "int", nullable: false),
                    ValorKWh = table.Column<double>(type: "float", nullable: false),
                    VigenciaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tarifas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SenhaHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    Acao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Entidade = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EntidadeId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DadosAnteriores = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DadosNovos = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IP = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Perfis",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Telefone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Documento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AvatarUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Perfis", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Perfis_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UnidadesConsumidoras",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    TipoImovel = table.Column<int>(type: "int", nullable: false),
                    CEP = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CodigoIBGE = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cidade = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnidadesConsumidoras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnidadesConsumidoras_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Dispositivos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnidadeConsumidoraId = table.Column<int>(type: "int", nullable: false),
                    CategoriaId = table.Column<int>(type: "int", nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoAparelho = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PotenciaWatts = table.Column<double>(type: "float", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dispositivos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Dispositivos_CategoriasAparelhos_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "CategoriasAparelhos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Dispositivos_UnidadesConsumidoras_UnidadeConsumidoraId",
                        column: x => x.UnidadeConsumidoraId,
                        principalTable: "UnidadesConsumidoras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Enderecos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnidadeConsumidoraId = table.Column<int>(type: "int", nullable: false),
                    CEP = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Logradouro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Numero = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Complemento = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Bairro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cidade = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UF = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enderecos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Enderecos_UnidadesConsumidoras_UnidadeConsumidoraId",
                        column: x => x.UnidadeConsumidoraId,
                        principalTable: "UnidadesConsumidoras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Alertas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    DispositivoId = table.Column<int>(type: "int", nullable: true),
                    Mensagem = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Lido = table.Column<bool>(type: "bit", nullable: false),
                    GeradoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alertas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Alertas_Dispositivos_DispositivoId",
                        column: x => x.DispositivoId,
                        principalTable: "Dispositivos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Alertas_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AnotacoesDispositivos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DispositivoId = table.Column<int>(type: "int", nullable: false),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    Conteudo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnotacoesDispositivos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnotacoesDispositivos_Dispositivos_DispositivoId",
                        column: x => x.DispositivoId,
                        principalTable: "Dispositivos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnotacoesDispositivos_Usuarios_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Chamados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    OperadorId = table.Column<int>(type: "int", nullable: true),
                    DispositivoId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chamados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chamados_Dispositivos_DispositivoId",
                        column: x => x.DispositivoId,
                        principalTable: "Dispositivos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Chamados_Usuarios_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Chamados_Usuarios_OperadorId",
                        column: x => x.OperadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Metas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DispositivoId = table.Column<int>(type: "int", nullable: false),
                    OperadorId = table.Column<int>(type: "int", nullable: true),
                    TipoMeta = table.Column<int>(type: "int", nullable: false),
                    ValorLimite = table.Column<double>(type: "float", nullable: false),
                    Justificativa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    AvaliacaoObs = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Metas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Metas_Dispositivos_DispositivoId",
                        column: x => x.DispositivoId,
                        principalTable: "Dispositivos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Metas_Usuarios_OperadorId",
                        column: x => x.OperadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Sensores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DispositivoId = table.Column<int>(type: "int", nullable: false),
                    ModeloSensor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NumeroSerie = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    UltimoSinal = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sensores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sensores_Dispositivos_DispositivoId",
                        column: x => x.DispositivoId,
                        principalTable: "Dispositivos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RelatoriosTecnicos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChamadoId = table.Column<int>(type: "int", nullable: false),
                    OperadorId = table.Column<int>(type: "int", nullable: false),
                    Conteudo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoOcorrencia = table.Column<int>(type: "int", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RelatoriosTecnicos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RelatoriosTecnicos_Chamados_ChamadoId",
                        column: x => x.ChamadoId,
                        principalTable: "Chamados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RelatoriosTecnicos_Usuarios_OperadorId",
                        column: x => x.OperadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Telemetrias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SensorId = table.Column<int>(type: "int", nullable: false),
                    ConsumoKWh = table.Column<double>(type: "float", nullable: false),
                    TensaoV = table.Column<double>(type: "float", nullable: false),
                    CorrenteA = table.Column<double>(type: "float", nullable: false),
                    RegistradoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DispositivoId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Telemetrias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Telemetrias_Dispositivos_DispositivoId",
                        column: x => x.DispositivoId,
                        principalTable: "Dispositivos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Telemetrias_Sensores_SensorId",
                        column: x => x.SensorId,
                        principalTable: "Sensores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "CategoriasAparelhos",
                columns: new[] { "Id", "Descricao", "IconeUrl", "IsActive", "IsDeleted", "Nome" },
                values: new object[,]
                {
                    { 1, "Aparelhos de ar condicionado, ventiladores e aquecedores", "thermometer", true, false, "Climatização" },
                    { 2, "Geladeiras, freezers, fornos e máquinas de lavar", "kitchen", true, false, "Linha Branca" },
                    { 3, "Computadores, televisores, consoles de videogame e roteadores", "tv", true, false, "Eletrônicos" }
                });

            migrationBuilder.InsertData(
                table: "Tarifas",
                columns: new[] { "Id", "Bandeira", "IsActive", "IsDeleted", "ValorKWh", "VigenciaInicio" },
                values: new object[] { 1, 0, true, false, 0.65000000000000002, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "CriadoEm", "Email", "IsActive", "IsDeleted", "Nome", "Role", "SenhaHash" },
                values: new object[] { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@greenenergy.com", true, false, "Administrador Geral", 0, "$2a$11$N5Uv5jX9oG6c4L54tN3GaeG2t.JkH4mXp.g/lS62PqD8l/lS0G3Nq" });

            migrationBuilder.InsertData(
                table: "Perfis",
                columns: new[] { "Id", "AvatarUrl", "Documento", "IsActive", "IsDeleted", "Telefone", "UsuarioId" },
                values: new object[] { 1, null, "000.000.000-00", true, false, "(00) 00000-0000", 1 });

            migrationBuilder.CreateIndex(
                name: "IX_Alertas_DispositivoId",
                table: "Alertas",
                column: "DispositivoId");

            migrationBuilder.CreateIndex(
                name: "IX_Alertas_UsuarioId",
                table: "Alertas",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_AnotacoesDispositivos_ClienteId",
                table: "AnotacoesDispositivos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_AnotacoesDispositivos_DispositivoId",
                table: "AnotacoesDispositivos",
                column: "DispositivoId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UsuarioId",
                table: "AuditLogs",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Chamados_ClienteId",
                table: "Chamados",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Chamados_DispositivoId",
                table: "Chamados",
                column: "DispositivoId");

            migrationBuilder.CreateIndex(
                name: "IX_Chamados_OperadorId",
                table: "Chamados",
                column: "OperadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Dispositivos_CategoriaId",
                table: "Dispositivos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Dispositivos_UnidadeConsumidoraId",
                table: "Dispositivos",
                column: "UnidadeConsumidoraId");

            migrationBuilder.CreateIndex(
                name: "IX_Enderecos_UnidadeConsumidoraId",
                table: "Enderecos",
                column: "UnidadeConsumidoraId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Metas_DispositivoId",
                table: "Metas",
                column: "DispositivoId");

            migrationBuilder.CreateIndex(
                name: "IX_Metas_OperadorId",
                table: "Metas",
                column: "OperadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Perfis_UsuarioId",
                table: "Perfis",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RelatoriosTecnicos_ChamadoId",
                table: "RelatoriosTecnicos",
                column: "ChamadoId");

            migrationBuilder.CreateIndex(
                name: "IX_RelatoriosTecnicos_OperadorId",
                table: "RelatoriosTecnicos",
                column: "OperadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Sensores_DispositivoId",
                table: "Sensores",
                column: "DispositivoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Telemetrias_DispositivoId",
                table: "Telemetrias",
                column: "DispositivoId");

            migrationBuilder.CreateIndex(
                name: "IX_Telemetrias_SensorId",
                table: "Telemetrias",
                column: "SensorId");

            migrationBuilder.CreateIndex(
                name: "IX_UnidadesConsumidoras_UsuarioId",
                table: "UnidadesConsumidoras",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alertas");

            migrationBuilder.DropTable(
                name: "AnotacoesDispositivos");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "CachesClima");

            migrationBuilder.DropTable(
                name: "CachesDadosIBGE");

            migrationBuilder.DropTable(
                name: "ConfiguracoesAPI");

            migrationBuilder.DropTable(
                name: "Enderecos");

            migrationBuilder.DropTable(
                name: "Metas");

            migrationBuilder.DropTable(
                name: "Perfis");

            migrationBuilder.DropTable(
                name: "RelatoriosTecnicos");

            migrationBuilder.DropTable(
                name: "Tarifas");

            migrationBuilder.DropTable(
                name: "Telemetrias");

            migrationBuilder.DropTable(
                name: "Chamados");

            migrationBuilder.DropTable(
                name: "Sensores");

            migrationBuilder.DropTable(
                name: "Dispositivos");

            migrationBuilder.DropTable(
                name: "CategoriasAparelhos");

            migrationBuilder.DropTable(
                name: "UnidadesConsumidoras");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
