using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;
using GreenEnergy.API.Services;
using GreenEnergy.API.Integrations;

namespace GreenEnergy.Tests
{
    // --- FAKES FOR PHASE 3 REPOSITORIES & CLIENTS ---

    public class FakeViaCepClient : IViaCepClient
    {
        public bool ThrowException { get; set; }
        public ViaCepDTO? FakeResult { get; set; }

        public Task<ViaCepDTO?> ConsultarCepAsync(string cep)
        {
            if (ThrowException)
            {
                throw new Exception("API ViaCEP offline");
            }
            return Task.FromResult(FakeResult);
        }
    }

    public class FakeUnidadeConsumidoraRepository : IUnidadeConsumidoraRepository
    {
        public List<UnidadeConsumidora> Unidades { get; } = new List<UnidadeConsumidora>();
        private int _idCounter = 1;

        public Task<UnidadeConsumidora?> GetByIdAsync(int id)
        {
            var u = Unidades.FirstOrDefault(x => x.Id == id && !x.IsDeleted);
            return Task.FromResult(u);
        }

        public Task<IEnumerable<UnidadeConsumidora>> ListAllAsync()
        {
            return Task.FromResult<IEnumerable<UnidadeConsumidora>>(Unidades.Where(x => !x.IsDeleted).ToList());
        }

        public Task<IEnumerable<UnidadeConsumidora>> ListByUsuarioIdAsync(int usuarioId)
        {
            return Task.FromResult<IEnumerable<UnidadeConsumidora>>(Unidades.Where(x => x.UsuarioId == usuarioId && !x.IsDeleted).ToList());
        }

        public Task AddAsync(UnidadeConsumidora unidade)
        {
            unidade.Id = _idCounter++;
            Unidades.Add(unidade);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(UnidadeConsumidora unidade)
        {
            var index = Unidades.FindIndex(x => x.Id == unidade.Id);
            if (index != -1)
            {
                Unidades[index] = unidade;
            }
            return Task.CompletedTask;
        }
    }

    public class FakeDispositivoRepository : IDispositivoRepository
    {
        public List<Dispositivo> Dispositivos { get; } = new List<Dispositivo>();
        private int _idCounter = 1;

        public Task<Dispositivo?> GetByIdAsync(int id)
        {
            var d = Dispositivos.FirstOrDefault(x => x.Id == id && !x.IsDeleted);
            return Task.FromResult(d);
        }

        public Task<IEnumerable<Dispositivo>> ListAllAsync()
        {
            return Task.FromResult<IEnumerable<Dispositivo>>(Dispositivos.Where(x => !x.IsDeleted).ToList());
        }

        public Task<IEnumerable<Dispositivo>> ListByUnidadeConsumidoraIdAsync(int unidadeId)
        {
            return Task.FromResult<IEnumerable<Dispositivo>>(Dispositivos.Where(x => x.UnidadeConsumidoraId == unidadeId && !x.IsDeleted).ToList());
        }

        public Task AddAsync(Dispositivo dispositivo)
        {
            dispositivo.Id = _idCounter++;
            Dispositivos.Add(dispositivo);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Dispositivo dispositivo)
        {
            var index = Dispositivos.FindIndex(x => x.Id == dispositivo.Id);
            if (index != -1)
            {
                Dispositivos[index] = dispositivo;
            }
            return Task.CompletedTask;
        }
    }

    public class FakeSensorRepository : ISensorRepository
    {
        public List<Sensor> Sensores { get; } = new List<Sensor>();
        private int _idCounter = 1;

        public Task<Sensor?> GetByIdAsync(int id)
        {
            var s = Sensores.FirstOrDefault(x => x.Id == id && !x.IsDeleted);
            return Task.FromResult(s);
        }

        public Task<IEnumerable<Sensor>> ListAllAsync()
        {
            return Task.FromResult<IEnumerable<Sensor>>(Sensores.Where(x => !x.IsDeleted).ToList());
        }

        public Task<IEnumerable<Sensor>> ListAvailableAsync()
        {
            return Task.FromResult<IEnumerable<Sensor>>(Sensores.Where(x => !x.IsDeleted && x.Status == SensorStatus.Disponivel && x.DispositivoId == null).ToList());
        }

        public Task AddAsync(Sensor sensor)
        {
            sensor.Id = _idCounter++;
            Sensores.Add(sensor);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Sensor sensor)
        {
            var index = Sensores.FindIndex(x => x.Id == sensor.Id);
            if (index != -1)
            {
                Sensores[index] = sensor;
            }
            return Task.CompletedTask;
        }
    }

    public class FakeCategoriaAparelhoRepository : ICategoriaAparelhoRepository
    {
        public List<CategoriaAparelho> Categorias { get; } = new List<CategoriaAparelho>();
        private int _idCounter = 1;

        public FakeCategoriaAparelhoRepository()
        {
            // Seed a default category
            Categorias.Add(new CategoriaAparelho { Id = 1, Nome = "Ar Condicionado", Descricao = "Aparelhos de climatização" });
        }

        public Task<CategoriaAparelho?> GetByIdAsync(int id)
        {
            var c = Categorias.FirstOrDefault(x => x.Id == id && !x.IsDeleted);
            return Task.FromResult(c);
        }

        public Task<IEnumerable<CategoriaAparelho>> ListAllAsync()
        {
            return Task.FromResult<IEnumerable<CategoriaAparelho>>(Categorias.Where(x => !x.IsDeleted).ToList());
        }

        public Task AddAsync(CategoriaAparelho categoria)
        {
            categoria.Id = _idCounter++;
            Categorias.Add(categoria);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(CategoriaAparelho categoria)
        {
            var index = Categorias.FindIndex(x => x.Id == categoria.Id);
            if (index != -1)
            {
                Categorias[index] = categoria;
            }
            return Task.CompletedTask;
        }
    }

    public class FakeChamadoRepository : IChamadoRepository
    {
        public List<Chamado> Chamados { get; } = new List<Chamado>();
        private int _idCounter = 1;

        public Task<Chamado?> GetByIdAsync(int id)
        {
            var c = Chamados.FirstOrDefault(x => x.Id == id && !x.IsDeleted);
            return Task.FromResult(c);
        }

        public Task<IEnumerable<Chamado>> ListAllAsync()
        {
            return Task.FromResult<IEnumerable<Chamado>>(Chamados.Where(x => !x.IsDeleted).ToList());
        }

        public Task<IEnumerable<Chamado>> ListByClienteIdAsync(int clienteId)
        {
            return Task.FromResult<IEnumerable<Chamado>>(Chamados.Where(x => x.ClienteId == clienteId && !x.IsDeleted).ToList());
        }

        public Task AddAsync(Chamado chamado)
        {
            chamado.Id = _idCounter++;
            Chamados.Add(chamado);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Chamado chamado)
        {
            var index = Chamados.FindIndex(x => x.Id == chamado.Id);
            if (index != -1)
            {
                Chamados[index] = chamado;
            }
            return Task.CompletedTask;
        }
    }

    public class FakeAnotacaoDispositivoRepository : IAnotacaoDispositivoRepository
    {
        public List<AnotacaoDispositivo> Anotacoes { get; } = new List<AnotacaoDispositivo>();
        private int _idCounter = 1;

        public Task<AnotacaoDispositivo?> GetByIdAsync(int id)
        {
            return Task.FromResult(Anotacoes.FirstOrDefault(x => x.Id == id && !x.IsDeleted));
        }

        public Task<IEnumerable<AnotacaoDispositivo>> ListByDispositivoIdAsync(int dispositivoId)
        {
            return Task.FromResult<IEnumerable<AnotacaoDispositivo>>(Anotacoes.Where(x => x.DispositivoId == dispositivoId && !x.IsDeleted).ToList());
        }

        public Task AddAsync(AnotacaoDispositivo anotacao)
        {
            anotacao.Id = _idCounter++;
            Anotacoes.Add(anotacao);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(AnotacaoDispositivo anotacao)
        {
            var index = Anotacoes.FindIndex(x => x.Id == anotacao.Id);
            if (index != -1)
            {
                Anotacoes[index] = anotacao;
            }
            return Task.CompletedTask;
        }
    }

    // --- PHASE 3 SERVICE TEST SUITES ---

    public class Phase3ServicesTests
    {
        private readonly FakeUnidadeConsumidoraRepository _unidadeRepo;
        private readonly FakeDispositivoRepository _dispositivoRepo;
        private readonly FakeSensorRepository _sensorRepo;
        private readonly FakeCategoriaAparelhoRepository _categoriaRepo;
        private readonly FakeChamadoRepository _chamadoRepo;
        private readonly FakeAnotacaoDispositivoRepository _anotacaoRepo;
        private readonly FakeViaCepClient _viaCepClient;

        private readonly UnidadeConsumidoraService _unidadeService;
        private readonly DispositivoService _dispositivoService;
        private readonly SensorService _sensorService;
        private readonly ChamadoService _chamadoService;

        public Phase3ServicesTests()
        {
            _unidadeRepo = new FakeUnidadeConsumidoraRepository();
            _dispositivoRepo = new FakeDispositivoRepository();
            _sensorRepo = new FakeSensorRepository();
            _categoriaRepo = new FakeCategoriaAparelhoRepository();
            _chamadoRepo = new FakeChamadoRepository();
            _anotacaoRepo = new FakeAnotacaoDispositivoRepository();
            _viaCepClient = new FakeViaCepClient();

            _unidadeService = new UnidadeConsumidoraService(_unidadeRepo, _viaCepClient);
            _dispositivoService = new DispositivoService(_dispositivoRepo, _unidadeRepo, _categoriaRepo, _sensorRepo, _anotacaoRepo);
            _sensorService = new SensorService(_sensorRepo);
            _chamadoService = new ChamadoService(_chamadoRepo, _dispositivoRepo, _sensorRepo, _unidadeRepo);
        }

        [Fact]
        public async Task CreateUnidadeConsumidora_ViaCepSuccessful_ShouldPopulateAddressAutomatic()
        {
            // Arrange
            _viaCepClient.ThrowException = false;
            _viaCepClient.FakeResult = new ViaCepDTO
            {
                Cep = "01001-000",
                Logradouro = "Praça da Sé",
                Bairro = "Sé",
                Localidade = "São Paulo",
                Uf = "SP",
                Ibge = "3550308",
                Erro = false
            };

            var request = new CreateUnidadeConsumidoraRequestDTO
            {
                CEP = "01001000",
                TipoImovel = TipoImovel.Comercial,
                Numero = "100",
                Complemento = "Sala 5"
            };

            // Act
            var response = await _unidadeService.CreateUnidadeConsumidoraAsync(request, usuarioId: 10);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal("01001000", response.Data.CEP);
            Assert.Equal("São Paulo", response.Data.Cidade);
            Assert.Equal("SP", response.Data.Estado);
            Assert.Equal("3550308", response.Data.CodigoIBGE);
            Assert.NotNull(response.Data.Endereco);
            Assert.Equal("Praça da Sé", response.Data.Endereco.Logradouro);
            Assert.Equal("Sé", response.Data.Endereco.Bairro);
        }

        [Fact]
        public async Task CreateUnidadeConsumidora_ViaCepOffline_WithManualFallback_ShouldCreateSuccessfully()
        {
            // Arrange
            _viaCepClient.ThrowException = true; // API offline

            var request = new CreateUnidadeConsumidoraRequestDTO
            {
                CEP = "01001000",
                TipoImovel = TipoImovel.Casa,
                Numero = "200",
                Logradouro = "Rua das Flores",
                Bairro = "Centro",
                Cidade = "Limeira",
                UF = "SP"
            };

            // Act
            var response = await _unidadeService.CreateUnidadeConsumidoraAsync(request, usuarioId: 10);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal("01001000", response.Data.CEP);
            Assert.Equal("Limeira", response.Data.Cidade);
            Assert.Equal("SP", response.Data.Estado);
            Assert.Equal(string.Empty, response.Data.CodigoIBGE);
            Assert.NotNull(response.Data.Endereco);
            Assert.Equal("Rua das Flores", response.Data.Endereco.Logradouro);
            Assert.Equal("Centro", response.Data.Endereco.Bairro);
        }

        [Fact]
        public async Task CreateUnidadeConsumidora_ViaCepOffline_WithoutManualFallback_ShouldReturnError()
        {
            // Arrange
            _viaCepClient.ThrowException = true; // API offline

            var request = new CreateUnidadeConsumidoraRequestDTO
            {
                CEP = "01001000",
                TipoImovel = TipoImovel.Casa,
                Numero = "200"
                // Manual fields left empty
            };

            // Act
            var response = await _unidadeService.CreateUnidadeConsumidoraAsync(request, usuarioId: 10);

            // Assert
            Assert.False(response.Success);
            Assert.Contains("ViaCEP está temporariamente fora do ar", response.Message);
        }

        [Fact]
        public async Task VincularSensor_SensorAvailable_ShouldLinkSuccessfully()
        {
            // Arrange
            var device = new Dispositivo
            {
                UnidadeConsumidoraId = 1,
                CategoriaId = 1,
                Nome = "Ar Split",
                TipoAparelho = "Ar Condicionado",
                PotenciaWatts = 1200,
                Status = DispositivoStatus.Ativo
            };
            await _dispositivoRepo.AddAsync(device);

            var sensor = new Sensor
            {
                ModeloSensor = "TEMP-X",
                NumeroSerie = "SN123456",
                Status = SensorStatus.Disponivel,
                DispositivoId = null
            };
            await _sensorRepo.AddAsync(sensor);

            // Act
            var linkResponse = await _dispositivoService.VincularSensorAsync(device.Id, sensor.Id);

            // Assert
            Assert.True(linkResponse.Success);
            
            var updatedSensor = await _sensorRepo.GetByIdAsync(sensor.Id);
            Assert.NotNull(updatedSensor);
            Assert.Equal(device.Id, updatedSensor.DispositivoId);
            Assert.Equal(SensorStatus.EmUso, updatedSensor.Status);
        }

        [Fact]
        public async Task VincularSensor_SensorAlreadyLinkedToOther_ShouldReturnError()
        {
            // Arrange
            var device1 = new Dispositivo { UnidadeConsumidoraId = 1, CategoriaId = 1, Nome = "Device 1" };
            var device2 = new Dispositivo { UnidadeConsumidoraId = 1, CategoriaId = 1, Nome = "Device 2" };
            await _dispositivoRepo.AddAsync(device1);
            await _dispositivoRepo.AddAsync(device2);

            var sensor = new Sensor
            {
                ModeloSensor = "TEMP-X",
                NumeroSerie = "SN123456",
                Status = SensorStatus.EmUso,
                DispositivoId = device1.Id
            };
            await _sensorRepo.AddAsync(sensor);

            // Act
            var linkResponse = await _dispositivoService.VincularSensorAsync(device2.Id, sensor.Id);

            // Assert
            Assert.False(linkResponse.Success);
            Assert.Contains("já está vinculado a outro dispositivo", linkResponse.Message);
        }

        [Fact]
        public async Task DesvincularSensor_ShouldReturnSensorToInventory()
        {
            // Arrange
            var device = new Dispositivo { UnidadeConsumidoraId = 1, CategoriaId = 1, Nome = "Device 1" };
            await _dispositivoRepo.AddAsync(device);

            var sensor = new Sensor
            {
                ModeloSensor = "TEMP-X",
                NumeroSerie = "SN123456",
                Status = SensorStatus.EmUso,
                DispositivoId = device.Id
            };
            await _sensorRepo.AddAsync(sensor);
            device.Sensor = sensor; // Navigation property setup

            // Act
            var unlinkResponse = await _dispositivoService.DesvincularSensorAsync(device.Id);

            // Assert
            Assert.True(unlinkResponse.Success);
            
            var updatedSensor = await _sensorRepo.GetByIdAsync(sensor.Id);
            Assert.NotNull(updatedSensor);
            Assert.Null(updatedSensor.DispositivoId);
            Assert.Equal(SensorStatus.Disponivel, updatedSensor.Status);
        }

        [Fact]
        public async Task TicketRemovalValidated_ShouldSoftDeleteDeviceAndUnlinkSensor()
        {
            // Arrange
            // 1. Setup consumer unit belonging to client 20
            var unit = new UnidadeConsumidora { UsuarioId = 20, CEP = "13480000" };
            await _unidadeRepo.AddAsync(unit);

            // 2. Setup device in that unit
            var device = new Dispositivo
            {
                UnidadeConsumidoraId = unit.Id,
                CategoriaId = 1,
                Nome = "Ventilador Antigo",
                IsActive = true,
                IsDeleted = false
            };
            await _dispositivoRepo.AddAsync(device);

            // 3. Setup sensor linked to device
            var sensor = new Sensor
            {
                ModeloSensor = "FLOW-Y",
                NumeroSerie = "SN7890",
                Status = SensorStatus.EmUso,
                DispositivoId = device.Id
            };
            await _sensorRepo.AddAsync(sensor);
            device.Sensor = sensor; // Navigation property

            // 4. Create support ticket for removal
            var chamado = new Chamado
            {
                ClienteId = 20,
                DispositivoId = device.Id,
                Tipo = TipoChamado.Remocao,
                Status = ChamadoStatus.Pendente
            };
            await _chamadoRepo.AddAsync(chamado);

            // Act - Operator validates ticket
            var updateResult = await _chamadoService.UpdateStatusAsync(
                chamado.Id, 
                new UpdateChamadoStatusRequestDTO { Status = ChamadoStatus.Validado }, 
                requestUserId: 5, // Operator ID
                requestUserRole: "Operador"
            );

            // Assert
            Assert.True(updateResult.Success);
            
            // Check chamado status
            var updatedChamado = await _chamadoRepo.GetByIdAsync(chamado.Id);
            Assert.NotNull(updatedChamado);
            Assert.Equal(ChamadoStatus.Validado, updatedChamado.Status);
            Assert.Equal(5, updatedChamado.OperadorId);

            // Check device soft delete
            var updatedDevice = await _dispositivoRepo.GetByIdAsync(device.Id);
            Assert.Null(updatedDevice); // GetByIdAsync fake filters out deleted devices

            var rawDevice = _dispositivoRepo.Dispositivos.First(d => d.Id == device.Id);
            Assert.False(rawDevice.IsActive);
            Assert.True(rawDevice.IsDeleted);

            // Check sensor decoupled and available
            var updatedSensor = await _sensorRepo.GetByIdAsync(sensor.Id);
            Assert.NotNull(updatedSensor);
            Assert.Null(updatedSensor.DispositivoId);
            Assert.Equal(SensorStatus.Disponivel, updatedSensor.Status);
        }
    }
}
