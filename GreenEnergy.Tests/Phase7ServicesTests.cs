using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Services;
using GreenEnergy.API.Integrations;

namespace GreenEnergy.Tests
{
    public class FakeHttpMessageHandler : HttpMessageHandler
    {
        public Func<HttpRequestMessage, HttpResponseMessage> ResponseGenerator { get; set; } = null!;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(ResponseGenerator(request));
        }
    }

    public class Phase7ServicesTests
    {
        private ApplicationDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new ApplicationDbContext(options);
        }

        #region IBGE SERVICE TESTS

        [Fact]
        public async Task ObterMunicipioPorCodigo_Cached_ShouldReturnCache()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var cached = new CacheDadosIBGE
            {
                CodigoIBGE = "3526902",
                NomeMunicipio = "Limeira",
                UF = "SP",
                PopulacaoEstimada = 306000,
                AtualizadoEm = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };
            db.CachesDadosIBGE.Add(cached);
            await db.SaveChangesAsync();

            var service = new IbgeService(db, new HttpClient());

            // Act
            var result = await service.ObterMunicipioPorCodigoAsync("3526902");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Limeira", result.Data.NomeMunicipio);
            Assert.Equal("SP", result.Data.UF);
        }

        [Fact]
        public async Task ObterMunicipioPorCodigo_NotCached_ShouldCallApiAndCache()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var handler = new FakeHttpMessageHandler
            {
                ResponseGenerator = req => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        "{\"id\":3526902,\"nome\":\"Limeira\",\"microrregiao\":{\"mesorregiao\":{\"UF\":{\"sigla\":\"SP\"}}}}",
                        Encoding.UTF8,
                        "application/json")
                }
            };
            var client = new HttpClient(handler);
            var service = new IbgeService(db, client);

            // Act
            var result = await service.ObterMunicipioPorCodigoAsync("3526902");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Limeira", result.Data.NomeMunicipio);
            Assert.Equal("SP", result.Data.UF);

            var dbCache = await db.CachesDadosIBGE.FirstOrDefaultAsync(c => c.CodigoIBGE == "3526902");
            Assert.NotNull(dbCache);
            Assert.Equal("Limeira", dbCache.NomeMunicipio);
        }

        [Fact]
        public async Task ObterMunicipioPorCodigo_ApiFailed_ShouldFallbackToSimulation()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var handler = new FakeHttpMessageHandler
            {
                ResponseGenerator = req => new HttpResponseMessage(HttpStatusCode.InternalServerError)
            };
            var client = new HttpClient(handler);
            var service = new IbgeService(db, client);

            // Act
            var result = await service.ObterMunicipioPorCodigoAsync("3526902");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Limeira", result.Data.NomeMunicipio); // Simulation fallback
            Assert.Equal("SP", result.Data.UF);
        }

        #endregion

        #region CLIMA SERVICE TESTS

        [Fact]
        public async Task ObterClimaPorCodigoIBGE_Cached_ShouldReturnCache()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var cached = new CacheClima
            {
                CodigoIBGE = "3526902",
                Cidade = "Limeira",
                TempMin = 20.0,
                TempMax = 30.0,
                UmidadePercent = 70.0,
                Descricao = "Sol",
                AtualizadoEm = DateTime.UtcNow,
                IsActive = true,
                IsDeleted = false
            };
            db.CachesClima.Add(cached);
            await db.SaveChangesAsync();

            var service = new ClimaService(db, new HttpClient(), null!);

            // Act
            var result = await service.ObterClimaPorCodigoIBGEAsync("3526902");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Limeira", result.Data.Cidade);
            Assert.Equal(20.0, result.Data.TempMin);
        }

        [Fact]
        public async Task ObterClimaPorCodigoIBGE_NotCached_WithApiKey_ShouldCallApiAndCache()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            // Seed OpenWeather Key
            var config = new ConfiguracaoAPI
            {
                NomeAPI = "OpenWeather",
                ChaveAcesso = "valid_key",
                BaseUrl = "https://api.openweathermap.org",
                IsActive = true
            };
            db.ConfiguracoesAPI.Add(config);
            await db.SaveChangesAsync();

            // Mock IBGE Service
            var ibgeRes = new ApiResponse<IbgeMunicipioResponseDTO>(new IbgeMunicipioResponseDTO
            {
                CodigoIBGE = "3526902",
                NomeMunicipio = "Limeira",
                UF = "SP"
            });
            var ibgeServiceMock = new FakeIbgeService(ibgeRes);

            var handler = new FakeHttpMessageHandler
            {
                ResponseGenerator = req => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        "{\"main\":{\"temp_min\":19.5,\"temp_max\":27.5,\"humidity\":70},\"weather\":[{\"description\":\"nublado\"}]}",
                        Encoding.UTF8,
                        "application/json")
                }
            };
            var client = new HttpClient(handler);
            var service = new ClimaService(db, client, ibgeServiceMock);

            // Act
            var result = await service.ObterClimaPorCodigoIBGEAsync("3526902");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("Limeira", result.Data.Cidade);
            Assert.Equal(19.5, result.Data.TempMin);
            Assert.Equal("nublado", result.Data.Descricao);
        }

        private class FakeIbgeService : IIbgeService
        {
            private readonly ApiResponse<IbgeMunicipioResponseDTO> _response;
            public FakeIbgeService(ApiResponse<IbgeMunicipioResponseDTO> response) => _response = response;
            public Task<ApiResponse<IbgeMunicipioResponseDTO>> ObterMunicipioPorCodigoAsync(string codigo) => Task.FromResult(_response);
        }

        #endregion

        #region ENDERECO SERVICE COMPARATIVO TESTS

        [Fact]
        public async Task ObterComparativoPorCep_ShouldCalculateEfficiencyCorrectly()
        {
            // Arrange
            var db = GetInMemoryDbContext();

            // Seed Unidades Consumidoras
            var u1 = new UnidadeConsumidora { UsuarioId = 1, CEP = "13480000", Cidade = "Limeira", TipoImovel = TipoImovel.Casa, IsActive = true, IsDeleted = false };
            var u2 = new UnidadeConsumidora { UsuarioId = 2, CEP = "13480000", Cidade = "Limeira", TipoImovel = TipoImovel.Casa, IsActive = true, IsDeleted = false };
            db.UnidadesConsumidoras.AddRange(u1, u2);
            await db.SaveChangesAsync();

            // Seed Dispositivos
            var d1 = new Dispositivo { UnidadeConsumidoraId = u1.Id, Nome = "Geladeira", PotenciaWatts = 300, CategoriaId = 1 };
            var d2 = new Dispositivo { UnidadeConsumidoraId = u2.Id, Nome = "Geladeira 2", PotenciaWatts = 300, CategoriaId = 1 };
            db.Dispositivos.AddRange(d1, d2);
            await db.SaveChangesAsync();

            // Seed Sensores
            var s1 = new Sensor { DispositivoId = d1.Id, ModeloSensor = "M1", NumeroSerie = "N1", Status = SensorStatus.EmUso, IsActive = true, IsDeleted = false };
            var s2 = new Sensor { DispositivoId = d2.Id, ModeloSensor = "M2", NumeroSerie = "N2", Status = SensorStatus.EmUso, IsActive = true, IsDeleted = false };
            db.Sensores.AddRange(s1, s2);
            await db.SaveChangesAsync();

            // Seed Telemetrias (u1 has 40 kWh, u2 has 60 kWh)
            // Regional average = (40 + 60) / 2 = 50 kWh.
            // Client 1 average = 40 kWh (20% less than regional average)
            var t1 = new Telemetria { SensorId = s1.Id, ConsumoKWh = 40.0, RegistradoEm = DateTime.UtcNow };
            var t2 = new Telemetria { SensorId = s2.Id, ConsumoKWh = 60.0, RegistradoEm = DateTime.UtcNow };
            s1.Telemetrias.Add(t1);
            s2.Telemetrias.Add(t2);
            await db.SaveChangesAsync();

            var service = new EnderecoService(db, new FakeViaCepClient(), null!);

            // Act
            var result = await service.ObterComparativoPorCepAsync("13480000", 1);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            var list = result.Data.ToList();
            Assert.Single(list);

            var comp = list[0];
            Assert.Equal("13480000", comp.CEP);
            Assert.Equal("Casa", comp.TipoImovel);
            Assert.Equal(40.0, comp.ConsumoClienteKWh);
            Assert.Equal(50.0, comp.ConsumoMedioRegionalKWh);
            Assert.Equal(-20.0, comp.DiferencaPercentual);
            Assert.Contains("20", comp.Mensagem);
            Assert.Contains("a menos que a média local", comp.Mensagem);
        }

        [Fact]
        public async Task ObterComparativoPorCidade_ShouldCalculateEfficiencyCorrectly()
        {
            // Arrange
            var db = GetInMemoryDbContext();

            // Seed Unidades Consumidoras
            var u1 = new UnidadeConsumidora { UsuarioId = 1, CEP = "13480000", Cidade = "Limeira", TipoImovel = TipoImovel.Apartamento, IsActive = true, IsDeleted = false };
            var u2 = new UnidadeConsumidora { UsuarioId = 2, CEP = "13480001", Cidade = "Limeira", TipoImovel = TipoImovel.Apartamento, IsActive = true, IsDeleted = false };
            db.UnidadesConsumidoras.AddRange(u1, u2);
            await db.SaveChangesAsync();

            // Seed Dispositivos
            var d1 = new Dispositivo { UnidadeConsumidoraId = u1.Id, Nome = "Ar Condicionado", PotenciaWatts = 1000, CategoriaId = 1 };
            var d2 = new Dispositivo { UnidadeConsumidoraId = u2.Id, Nome = "Ar Condicionado 2", PotenciaWatts = 1000, CategoriaId = 1 };
            db.Dispositivos.AddRange(d1, d2);
            await db.SaveChangesAsync();

            // Seed Sensores
            var s1 = new Sensor { DispositivoId = d1.Id, ModeloSensor = "M1", NumeroSerie = "N1", Status = SensorStatus.EmUso, IsActive = true, IsDeleted = false };
            var s2 = new Sensor { DispositivoId = d2.Id, ModeloSensor = "M2", NumeroSerie = "N2", Status = SensorStatus.EmUso, IsActive = true, IsDeleted = false };
            db.Sensores.AddRange(s1, s2);
            await db.SaveChangesAsync();

            // Seed Telemetrias (u1 has 120 kWh, u2 has 80 kWh)
            // Regional average = (120 + 80) / 2 = 100 kWh.
            // Client 1 average = 120 kWh (20% more than regional average)
            var t1 = new Telemetria { SensorId = s1.Id, ConsumoKWh = 120.0, RegistradoEm = DateTime.UtcNow };
            var t2 = new Telemetria { SensorId = s2.Id, ConsumoKWh = 80.0, RegistradoEm = DateTime.UtcNow };
            s1.Telemetrias.Add(t1);
            s2.Telemetrias.Add(t2);
            await db.SaveChangesAsync();

            var service = new EnderecoService(db, new FakeViaCepClient(), null!);

            // Act
            var result = await service.ObterComparativoPorCidadeAsync("Limeira", 1);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            var list = result.Data.ToList();
            Assert.Single(list);

            var comp = list[0];
            Assert.Equal("Apartamento", comp.TipoImovel);
            Assert.Equal(120.0, comp.ConsumoClienteKWh);
            Assert.Equal(100.0, comp.ConsumoMedioRegionalKWh);
            Assert.Equal(20.0, comp.DiferencaPercentual);
            Assert.Contains("20", comp.Mensagem);
            Assert.Contains("a mais que a média regional", comp.Mensagem);
        }

        #endregion
    }
}
