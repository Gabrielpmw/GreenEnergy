using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;
using GreenEnergy.API.Services;

namespace GreenEnergy.Tests
{
    public class Phase6ServicesTests
    {
        private ApplicationDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        #region TARIFA TESTS

        [Fact]
        public async Task CreateTarifa_ValidInput_ShouldSucceed()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new TarifaRepository(db);
            var service = new TarifaService(repo);

            var dto = new CreateTarifaRequestDTO
            {
                Bandeira = BandeiraTarifa.Amarela,
                ValorKWh = 0.78
            };

            // Act
            var result = await service.CreateTarifaAsync(dto);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Amarela", result.Data.Bandeira);
            Assert.Equal(0.78, result.Data.ValorKWh);
            Assert.True(result.Data.IsActive);

            var inDb = await db.Tarifas.FirstOrDefaultAsync(t => t.Id == result.Data.Id);
            Assert.NotNull(inDb);
            Assert.Equal(BandeiraTarifa.Amarela, inDb.Bandeira);
        }

        [Fact]
        public async Task CreateTarifa_NegativeOrZeroValue_ShouldFail()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new TarifaRepository(db);
            var service = new TarifaService(repo);

            var dto = new CreateTarifaRequestDTO
            {
                Bandeira = BandeiraTarifa.Verde,
                ValorKWh = -0.05
            };

            // Act
            var result = await service.CreateTarifaAsync(dto);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("maior que zero", result.Message);
        }

        [Fact]
        public async Task GetLatestActive_MultipleTariffs_ShouldReturnNewestActive()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new TarifaRepository(db);
            var service = new TarifaService(repo);

            var t1 = new Tarifa { Bandeira = BandeiraTarifa.Verde, ValorKWh = 0.60, VigenciaInicio = DateTime.UtcNow.AddDays(-2), IsActive = true };
            var t2 = new Tarifa { Bandeira = BandeiraTarifa.Amarela, ValorKWh = 0.70, VigenciaInicio = DateTime.UtcNow.AddDays(-1), IsActive = true };
            var t3 = new Tarifa { Bandeira = BandeiraTarifa.Vermelha1, ValorKWh = 0.85, VigenciaInicio = DateTime.UtcNow, IsActive = false }; // inactive

            await db.Tarifas.AddRangeAsync(t1, t2, t3);
            await db.SaveChangesAsync();

            // Act
            var result = await service.GetLatestActiveAsync();

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Amarela", result.Data.Bandeira); // newest active is t2
            Assert.Equal(0.70, result.Data.ValorKWh);
        }

        [Fact]
        public async Task ToggleTarifaState_ShouldUpdateCorrectly()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new TarifaRepository(db);
            var service = new TarifaService(repo);

            var t = new Tarifa { Bandeira = BandeiraTarifa.Verde, ValorKWh = 0.60, IsActive = true };
            await db.Tarifas.AddAsync(t);
            await db.SaveChangesAsync();

            // Act
            var deactivateResult = await service.ToggleTarifaStateAsync(t.Id, false);

            // Assert
            Assert.True(deactivateResult.Success);
            Assert.False(deactivateResult.Data!.IsActive);

            var inDb = await db.Tarifas.FindAsync(t.Id);
            Assert.False(inDb!.IsActive);
        }

        #endregion

        #region CONFIGURACAO API TESTS

        [Fact]
        public async Task CreateConfig_Valid_ShouldSucceed()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new ConfiguracaoAPIRepository(db);
            var service = new ConfiguracaoAPIService(repo);

            var dto = new CreateConfiguracaoAPIRequestDTO
            {
                NomeAPI = "OpenWeather",
                ChaveAcesso = "secret-key-123",
                BaseUrl = "https://api.openweathermap.org"
            };

            // Act
            var result = await service.CreateConfigAsync(dto);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("OpenWeather", result.Data.NomeAPI);
        }

        [Fact]
        public async Task CreateConfig_DuplicateName_ShouldFail()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new ConfiguracaoAPIRepository(db);
            var service = new ConfiguracaoAPIService(repo);

            var c = new ConfiguracaoAPI { NomeAPI = "IBGE", ChaveAcesso = "abc", BaseUrl = "https://ibge.gov" };
            await db.ConfiguracoesAPI.AddAsync(c);
            await db.SaveChangesAsync();

            var dto = new CreateConfiguracaoAPIRequestDTO
            {
                NomeAPI = "IBGE",
                ChaveAcesso = "xyz",
                BaseUrl = "https://ibge.gov"
            };

            // Act
            var result = await service.CreateConfigAsync(dto);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Já existe uma configuração", result.Message);
        }

        [Fact]
        public async Task UpdateConfig_Existing_ShouldSucceed()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new ConfiguracaoAPIRepository(db);
            var service = new ConfiguracaoAPIService(repo);

            var c = new ConfiguracaoAPI { NomeAPI = "IBGE", ChaveAcesso = "abc", BaseUrl = "https://ibge.gov" };
            await db.ConfiguracoesAPI.AddAsync(c);
            await db.SaveChangesAsync();

            var dto = new UpdateConfiguracaoAPIRequestDTO
            {
                ChaveAcesso = "new-key",
                BaseUrl = "https://servicodados.ibge.gov.br"
            };

            // Act
            var result = await service.UpdateConfigAsync(c.Id, dto);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("new-key", result.Data!.ChaveAcesso);
            Assert.Equal("https://servicodados.ibge.gov.br", result.Data!.BaseUrl);
        }

        [Fact]
        public async Task DeleteConfig_ShouldSoftDelete()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new ConfiguracaoAPIRepository(db);
            var service = new ConfiguracaoAPIService(repo);

            var c = new ConfiguracaoAPI { NomeAPI = "IBGE", ChaveAcesso = "abc", BaseUrl = "https://ibge.gov", IsActive = true };
            await db.ConfiguracoesAPI.AddAsync(c);
            await db.SaveChangesAsync();

            // Act
            var result = await service.DeleteConfigAsync(c.Id);

            // Assert
            Assert.True(result.Success);

            var inDb = await db.ConfiguracoesAPI.FindAsync(c.Id);
            Assert.True(inDb!.IsDeleted);
            Assert.False(inDb!.IsActive);
        }

        #endregion

        #region AUDIT LOG TESTS

        [Fact]
        public async Task ListFiltered_ShouldApplyFiltersCorrectly()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var repo = new AuditLogRepository(db);
            var service = new AuditLogService(repo);

            var u1 = new Usuario { Id = 10, Nome = "Admin User", Email = "admin@test.com", SenhaHash = "x", Role = UsuarioRole.Admin };
            var u2 = new Usuario { Id = 20, Nome = "Client User", Email = "client@test.com", SenhaHash = "y", Role = UsuarioRole.Cliente };
            await db.Usuarios.AddRangeAsync(u1, u2);

            var log1 = new AuditLog { UsuarioId = 10, Acao = "Criar Operador", Entidade = "Usuario", Timestamp = DateTime.UtcNow.AddHours(-1) };
            var log2 = new AuditLog { UsuarioId = 20, Acao = "Atualizar Perfil", Entidade = "Usuario", Timestamp = DateTime.UtcNow };

            await db.AuditLogs.AddRangeAsync(log1, log2);
            await db.SaveChangesAsync();

            // Act & Assert 1: filter by Role Admin
            var resultAdmin = await service.ListFilteredAsync("Admin", null, null, null, null);
            Assert.True(resultAdmin.Success);
            Assert.Single(resultAdmin.Data!);
            Assert.Equal("Criar Operador", resultAdmin.Data!.First().Acao);

            // Act & Assert 2: filter by Action "Atualizar"
            var resultAction = await service.ListFilteredAsync(null, null, null, "Atualizar", null);
            Assert.True(resultAction.Success);
            Assert.Single(resultAction.Data!);
            Assert.Equal(20, resultAction.Data!.First().UsuarioId);
        }

        #endregion

        #region ADMIN DASHBOARD TESTS

        [Fact]
        public async Task GetDashboardMetrics_ShouldConsolidateAllKPIs()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var service = new AdminDashboardService(db);

            // Seed Telemetrias
            var t1 = new Telemetria { SensorId = 1, ConsumoKWh = 12.5, TensaoV = 127, CorrenteA = 10 };
            var t2 = new Telemetria { SensorId = 1, ConsumoKWh = 25.5, TensaoV = 127, CorrenteA = 10 };
            await db.Telemetrias.AddRangeAsync(t1, t2);

            // Seed Sensores
            var s1 = new Sensor { DispositivoId = 1, Status = SensorStatus.EmUso, ModeloSensor = "SNSR", NumeroSerie = "SNSR1", IsActive = true };
            var s2 = new Sensor { DispositivoId = 2, Status = SensorStatus.Disponivel, ModeloSensor = "SNSR", NumeroSerie = "SNSR2", IsActive = true };
            var s3 = new Sensor { DispositivoId = 3, Status = SensorStatus.Defeito, ModeloSensor = "SNSR", NumeroSerie = "SNSR3", IsActive = true };
            await db.Sensores.AddRangeAsync(s1, s2, s3);

            // Seed Chamados
            var ch1 = new Chamado { ClienteId = 10, DispositivoId = 1, Tipo = TipoChamado.Manutencao, Status = ChamadoStatus.Pendente, Descricao = "Test" };
            var ch2 = new Chamado { ClienteId = 10, DispositivoId = 2, Tipo = TipoChamado.Instalacao, Status = ChamadoStatus.EmAnalise, Descricao = "Test" };
            var ch3 = new Chamado { ClienteId = 10, DispositivoId = 3, Tipo = TipoChamado.Remocao, Status = ChamadoStatus.Validado, Descricao = "Test" };
            await db.Chamados.AddRangeAsync(ch1, ch2, ch3);

            // Seed OpenWeather API Config
            var weatherCfg = new ConfiguracaoAPI { NomeAPI = "OpenWeather", ChaveAcesso = "abc", BaseUrl = "https://weather.com", IsActive = true };
            await db.ConfiguracoesAPI.AddAsync(weatherCfg);

            // Seed Heartbeat (recently updated)
            var heartbeat = new ConfiguracaoAPI
            {
                NomeAPI = "Worker_Heartbeat",
                ChaveAcesso = DateTime.UtcNow.AddSeconds(-30).ToString("O"),
                BaseUrl = "LocalWorker",
                IsActive = true
            };
            await db.ConfiguracoesAPI.AddAsync(heartbeat);

            await db.SaveChangesAsync();

            // Act
            var result = await service.GetDashboardMetricsAsync();

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(38.0, result.Data.VolumeTotalEnergiaKWh); // 12.5 + 25.5
            Assert.Equal(1, result.Data.SensoresAtivosCount); // s1 only
            Assert.Equal(2, result.Data.SensoresInativosCount); // s2, s3
            Assert.Equal(2, result.Data.ChamadosPendentesCount); // ch1, ch2
            Assert.Equal("Saudável", result.Data.SaudeWorkerService);
            Assert.Equal("Configurada", result.Data.StatusApisExternas["OpenWeather"]);
            Assert.Equal("Configurada", result.Data.StatusApisExternas["IBGE"]); // IBGE é pública
        }

        #endregion
    }
}
