using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.Worker.Workers;
using Xunit;

namespace GreenEnergy.Tests
{
    public class Phase4WorkersTests
    {
        private DbContextOptions<ApplicationDbContext> CreateNewInMemoryDatabaseOptions()
        {
            return new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
        }

        [Fact]
        public async Task TelemetriaWorker_SimularCiclo_ShouldInsertNormalTelemetry()
        {
            // Arrange
            var options = CreateNewInMemoryDatabaseOptions();
            using var db = new ApplicationDbContext(options);
            
            // Setup Seed inicial
            var categoria = new CategoriaAparelho { Id = 1, Nome = "Climatização", Descricao = "Test", IconeUrl = "test", IsActive = true, IsDeleted = false };
            db.CategoriasAparelhos.Add(categoria);

            var cliente = new Usuario { Id = 2, Nome = "Pedro Teste", Email = "pedro@test.com", SenhaHash = "hash", Role = UsuarioRole.Cliente, IsActive = true, IsDeleted = false };
            db.Usuarios.Add(cliente);

            var unidade = new UnidadeConsumidora { Id = 1, UsuarioId = 2, TipoImovel = TipoImovel.Casa, CEP = "13480001", Cidade = "Limeira", Estado = "SP", IsActive = true, IsDeleted = false };
            db.UnidadesConsumidoras.Add(unidade);

            var dispositivo = new Dispositivo 
            { 
                Id = 10, 
                UnidadeConsumidoraId = 1, 
                CategoriaId = 1, 
                Nome = "Ar Condicionado LG", 
                TipoAparelho = "Ar Condicionado", 
                PotenciaWatts = 1000, 
                Status = DispositivoStatus.Ativo, 
                IsActive = true, 
                IsDeleted = false 
            };
            db.Dispositivos.Add(dispositivo);

            var sensor = new Sensor 
            { 
                Id = 5, 
                DispositivoId = 10, 
                ModeloSensor = "SNSR-01", 
                NumeroSerie = "SN-TEST123", 
                Status = SensorStatus.EmUso, 
                UltimoSinal = DateTime.UtcNow.AddMinutes(-5), 
                IsActive = true, 
                IsDeleted = false 
            };
            db.Sensores.Add(sensor);
            await db.SaveChangesAsync();

            var services = new ServiceCollection();
            services.AddSingleton(db);
            var serviceProvider = services.BuildServiceProvider();
            var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

            var logger = new LoggerFactory().CreateLogger<TelemetriaWorker>();
            var worker = new TelemetriaWorker(scopeFactory, logger);

            // Act: Invocar o método privado via Reflection
            var method = typeof(TelemetriaWorker).GetMethod("SimularCicloTelemetriaAsync", BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.NotNull(method);
            await (Task)method.Invoke(worker, null)!;

            // Assert
            var telemetrias = await db.Telemetrias.ToListAsync();
            Assert.Single(telemetrias);
            
            var t = telemetrias.First();
            Assert.Equal(5, t.SensorId);
            
            // Verificação de tensão ampla para comportar 127V, 220V e sobretensões (140V/240V)
            Assert.True(t.ConsumoKWh > 0);
            Assert.True(t.TensaoV >= 110 && t.TensaoV <= 250);
            Assert.True(t.CorrenteA > 0);
        }

        [Fact]
        public async Task AlertaWorker_AnomaliaDetec_ShouldGenerateCriticalAlert()
        {
            // Arrange
            var options = CreateNewInMemoryDatabaseOptions();
            using var db = new ApplicationDbContext(options);

            var cliente = new Usuario { Id = 2, Nome = "Pedro Teste", Email = "pedro@test.com", SenhaHash = "hash", Role = UsuarioRole.Cliente, IsActive = true, IsDeleted = false };
            db.Usuarios.Add(cliente);
            var unidade = new UnidadeConsumidora { Id = 1, UsuarioId = 2, TipoImovel = TipoImovel.Casa, CEP = "13480001", Cidade = "Limeira", Estado = "SP", IsActive = true, IsDeleted = false };
            db.UnidadesConsumidoras.Add(unidade);
            var dispositivo = new Dispositivo { Id = 10, UnidadeConsumidoraId = 1, CategoriaId = 1, Nome = "Equipamento", PotenciaWatts = 1000, Status = DispositivoStatus.Ativo, IsActive = true, IsDeleted = false };
            db.Dispositivos.Add(dispositivo);
            var sensor = new Sensor { Id = 5, DispositivoId = 10, ModeloSensor = "SNSR-01", NumeroSerie = "SN-TEST123", Status = SensorStatus.EmUso, IsActive = true, IsDeleted = false };
            db.Sensores.Add(sensor);

            // Inserir telemetria anômala (pico de consumo: nominal é 0.0125 kWh, inserimos 0.03 kWh que é > 1.5x)
            var telemetriaAnomala = new Telemetria
            {
                SensorId = 5,
                ConsumoKWh = 0.03, // > 0.0125 * 1.5
                TensaoV = 127,
                CorrenteA = 10.0, // > (1000 / 127) * 1.5
                RegistradoEm = DateTime.UtcNow
            };
            db.Telemetrias.Add(telemetriaAnomala);
            await db.SaveChangesAsync();

            var services = new ServiceCollection();
            services.AddSingleton(db);
            var serviceProvider = services.BuildServiceProvider();
            var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

            var logger = new LoggerFactory().CreateLogger<AlertaWorker>();
            var worker = new AlertaWorker(scopeFactory, logger);

            // Act
            var method = typeof(AlertaWorker).GetMethod("ProcessarAnomaliasCriticasAsync", BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.NotNull(method);
            await (Task)method.Invoke(worker, new object[] { db })!;
            await db.SaveChangesAsync(); // Persiste no banco em memória os alertas gerados

            // Assert
            var alertas = await db.Alertas.ToListAsync();
            Assert.Single(alertas);
            var alerta = alertas.First();
            Assert.Equal(TipoAlerta.Critico, alerta.Tipo);
            Assert.Contains("Anomalia detectada", alerta.Mensagem);
        }

        [Fact]
        public async Task AlertaWorker_MetaEstourada_ShouldGenerateAlerta()
        {
            // Arrange
            var options = CreateNewInMemoryDatabaseOptions();
            using var db = new ApplicationDbContext(options);

            var cliente = new Usuario { Id = 2, Nome = "Pedro Teste", Email = "pedro@test.com", SenhaHash = "hash", Role = UsuarioRole.Cliente, IsActive = true, IsDeleted = false };
            db.Usuarios.Add(cliente);
            var unidade = new UnidadeConsumidora { Id = 1, UsuarioId = 2, TipoImovel = TipoImovel.Casa, CEP = "13480001", Cidade = "Limeira", Estado = "SP", IsActive = true, IsDeleted = false };
            db.UnidadesConsumidoras.Add(unidade);
            var dispositivo = new Dispositivo { Id = 10, UnidadeConsumidoraId = 1, CategoriaId = 1, Nome = "Equipamento", PotenciaWatts = 1000, Status = DispositivoStatus.Ativo, IsActive = true, IsDeleted = false };
            db.Dispositivos.Add(dispositivo);
            var sensor = new Sensor { Id = 5, DispositivoId = 10, ModeloSensor = "SNSR-01", NumeroSerie = "SN-TEST123", Status = SensorStatus.EmUso, IsActive = true, IsDeleted = false };
            db.Sensores.Add(sensor);

            // Meta de limite de 10 kWh
            var meta = new Meta
            {
                Id = 1,
                DispositivoId = 10,
                TipoMeta = TipoMeta.KWh,
                ValorLimite = 10.0,
                Status = MetaStatus.Aprovada,
                IsActive = true,
                IsDeleted = false
            };
            db.Metas.Add(meta);

            // Inserir telemetria acumulada de 12 kWh no mês corrente
            var t1 = new Telemetria { SensorId = 5, ConsumoKWh = 7.0, TensaoV = 127, CorrenteA = 3.0, RegistradoEm = DateTime.UtcNow };
            var t2 = new Telemetria { SensorId = 5, ConsumoKWh = 5.0, TensaoV = 127, CorrenteA = 3.0, RegistradoEm = DateTime.UtcNow };
            db.Telemetrias.AddRange(t1, t2);
            await db.SaveChangesAsync();

            var services = new ServiceCollection();
            services.AddSingleton(db);
            var serviceProvider = services.BuildServiceProvider();
            var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

            var logger = new LoggerFactory().CreateLogger<AlertaWorker>();
            var worker = new AlertaWorker(scopeFactory, logger);

            // Act
            var method = typeof(AlertaWorker).GetMethod("ProcessarMetasConsumoAsync", BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.NotNull(method);
            await (Task)method.Invoke(worker, new object[] { db, 0.65 })!;
            await db.SaveChangesAsync(); // Salvar alertas gerados pelo método no contexto

            // Assert
            var alertas = await db.Alertas.ToListAsync();
            Assert.Single(alertas);
            var alerta = alertas.First();
            Assert.Equal(TipoAlerta.Alerta, alerta.Tipo);
            Assert.Contains("meta de consumo de 10", alerta.Mensagem);
        }

        [Fact]
        public async Task AlertaWorker_AlertaClimatico_ShouldGenerateInformativo()
        {
            // Arrange
            var options = CreateNewInMemoryDatabaseOptions();
            using var db = new ApplicationDbContext(options);

            var cliente = new Usuario { Id = 2, Nome = "Pedro Teste", Email = "pedro@test.com", SenhaHash = "hash", Role = UsuarioRole.Cliente, IsActive = true, IsDeleted = false };
            db.Usuarios.Add(cliente);
            var unidade = new UnidadeConsumidora { Id = 1, UsuarioId = 2, TipoImovel = TipoImovel.Casa, CEP = "13480001", Cidade = "Limeira", Estado = "SP", IsActive = true, IsDeleted = false };
            db.UnidadesConsumidoras.Add(unidade);
            
            // Categoria ID 1 = Climatização
            var dispositivo = new Dispositivo { Id = 10, UnidadeConsumidoraId = 1, CategoriaId = 1, Nome = "Ar Condicionado", TipoAparelho = "Ar Condicionado", PotenciaWatts = 1000, Status = DispositivoStatus.Ativo, IsActive = true, IsDeleted = false };
            db.Dispositivos.Add(dispositivo);

            // Cache clima com TempMax > 30°C
            var clima = new CacheClima { CodigoIBGE = "3526902", Cidade = "Limeira", TempMin = 22.0, TempMax = 32.5, UmidadePercent = 70, Descricao = "Ensolarado", AtualizadoEm = DateTime.UtcNow, IsActive = true, IsDeleted = false };
            db.CachesClima.Add(clima);
            await db.SaveChangesAsync();

            var services = new ServiceCollection();
            services.AddSingleton(db);
            var serviceProvider = services.BuildServiceProvider();
            var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

            var logger = new LoggerFactory().CreateLogger<AlertaWorker>();
            var worker = new AlertaWorker(scopeFactory, logger);

            // Act
            var method = typeof(AlertaWorker).GetMethod("ProcessarAlertasClimaticosAsync", BindingFlags.NonPublic | BindingFlags.Instance);
            Assert.NotNull(method);
            await (Task)method.Invoke(worker, new object[] { db })!;
            await db.SaveChangesAsync(); // Salvar alertas gerados pelo método no contexto

            // Assert
            var alertas = await db.Alertas.ToListAsync();
            Assert.Single(alertas);
            var alerta = alertas.First();
            Assert.Equal(TipoAlerta.Informativo, alerta.Tipo);
            Assert.Contains("Temperatura elevada de", alerta.Mensagem);
        }
    }
}
