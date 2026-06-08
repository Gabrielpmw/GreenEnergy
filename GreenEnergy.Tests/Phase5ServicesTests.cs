using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;
using GreenEnergy.API.Services;

namespace GreenEnergy.Tests
{
    // --- FAKES FOR PHASE 5 REPOSITORIES ---

    public class FakeMetaRepository : IMetaRepository
    {
        public List<Meta> Metas { get; } = new List<Meta>();
        private int _idCounter = 1;

        public Task<Meta?> GetByIdAsync(int id)
        {
            var m = Metas.FirstOrDefault(x => x.Id == id && !x.IsDeleted);
            return Task.FromResult(m);
        }

        public Task<IEnumerable<Meta>> ListAllAsync()
        {
            return Task.FromResult<IEnumerable<Meta>>(Metas.Where(x => !x.IsDeleted).ToList());
        }

        public Task<IEnumerable<Meta>> ListByDispositivoIdAsync(int dispositivoId)
        {
            return Task.FromResult<IEnumerable<Meta>>(Metas.Where(x => x.DispositivoId == dispositivoId && !x.IsDeleted).ToList());
        }

        public Task AddAsync(Meta meta)
        {
            meta.Id = _idCounter++;
            Metas.Add(meta);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Meta meta)
        {
            var index = Metas.FindIndex(x => x.Id == meta.Id);
            if (index != -1)
            {
                Metas[index] = meta;
            }
            return Task.CompletedTask;
        }
    }

    public class FakeRelatorioTecnicoRepository : IRelatorioTecnicoRepository
    {
        public List<RelatorioTecnico> Relatorios { get; } = new List<RelatorioTecnico>();
        private int _idCounter = 1;

        public Task<RelatorioTecnico?> GetByIdAsync(int id)
        {
            var r = Relatorios.FirstOrDefault(x => x.Id == id && !x.IsDeleted);
            return Task.FromResult(r);
        }

        public Task<IEnumerable<RelatorioTecnico>> ListAllAsync()
        {
            return Task.FromResult<IEnumerable<RelatorioTecnico>>(Relatorios.Where(x => !x.IsDeleted).ToList());
        }

        public Task<IEnumerable<RelatorioTecnico>> ListByChamadoIdAsync(int chamadoId)
        {
            return Task.FromResult<IEnumerable<RelatorioTecnico>>(Relatorios.Where(x => x.ChamadoId == chamadoId && !x.IsDeleted).ToList());
        }

        public Task AddAsync(RelatorioTecnico relatorio)
        {
            relatorio.Id = _idCounter++;
            Relatorios.Add(relatorio);
            return Task.CompletedTask;
        }
    }

    // --- PHASE 5 TEST SUITES ---

    public class Phase5ServicesTests
    {
        private readonly FakeUnidadeConsumidoraRepository _unidadeRepo;
        private readonly FakeDispositivoRepository _dispositivoRepo;
        private readonly FakeSensorRepository _sensorRepo;
        private readonly FakeCategoriaAparelhoRepository _categoriaRepo;
        private readonly FakeChamadoRepository _chamadoRepo;
        private readonly FakeAnotacaoDispositivoRepository _anotacaoRepo;
        private readonly FakeMetaRepository _metaRepo;
        private readonly FakeRelatorioTecnicoRepository _relatorioRepo;

        private readonly DispositivoService _dispositivoService;
        private readonly ChamadoService _chamadoService;
        private readonly MetaService _metaService;
        private readonly RelatorioTecnicoService _relatorioService;

        public Phase5ServicesTests()
        {
            _unidadeRepo = new FakeUnidadeConsumidoraRepository();
            _dispositivoRepo = new FakeDispositivoRepository();
            _sensorRepo = new FakeSensorRepository();
            _categoriaRepo = new FakeCategoriaAparelhoRepository();
            _chamadoRepo = new FakeChamadoRepository();
            _anotacaoRepo = new FakeAnotacaoDispositivoRepository();
            _metaRepo = new FakeMetaRepository();
            _relatorioRepo = new FakeRelatorioTecnicoRepository();

            _dispositivoService = new DispositivoService(_dispositivoRepo, _unidadeRepo, _categoriaRepo, _sensorRepo, _anotacaoRepo, null!);
            _chamadoService = new ChamadoService(_chamadoRepo, _dispositivoRepo, _sensorRepo, _unidadeRepo);
            _metaService = new MetaService(_metaRepo, _dispositivoRepo, _unidadeRepo);
            _relatorioService = new RelatorioTecnicoService(_relatorioRepo, _chamadoRepo);
        }

        // --- TESTES DE METAS ---

        [Fact]
        public async Task ProporMeta_OwnerClient_ShouldSucceed()
        {
            // Arrange
            var unit = new UnidadeConsumidora { UsuarioId = 10, CEP = "13480000" };
            await _unidadeRepo.AddAsync(unit);

            var device = new Dispositivo { UnidadeConsumidoraId = unit.Id, CategoriaId = 1, Nome = "Ar Split 12k", PotenciaWatts = 1200 };
            await _dispositivoRepo.AddAsync(device);

            var dto = new CreateMetaRequestDTO
            {
                DispositivoId = device.Id,
                TipoMeta = TipoMeta.KWh,
                ValorLimite = 150.0,
                Justificativa = "Economizar na conta de energia de Julho."
            };

            // Act
            var response = await _metaService.ProporMetaAsync(dto, clienteId: 10);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal("Proposta", response.Data.Status);
            Assert.Equal(150.0, response.Data.ValorLimite);
            Assert.Equal("Economizar na conta de energia de Julho.", response.Data.Justificativa);
        }

        [Fact]
        public async Task ProporMeta_NonOwnerClient_ShouldFail()
        {
            // Arrange
            var unit = new UnidadeConsumidora { UsuarioId = 10, CEP = "13480000" };
            await _unidadeRepo.AddAsync(unit);

            var device = new Dispositivo { UnidadeConsumidoraId = unit.Id, CategoriaId = 1, Nome = "Ar Split 12k" };
            await _dispositivoRepo.AddAsync(device);

            var dto = new CreateMetaRequestDTO
            {
                DispositivoId = device.Id,
                TipoMeta = TipoMeta.KWh,
                ValorLimite = 150.0,
                Justificativa = "Tentando invadir dispositivo alheio."
            };

            // Act
            var response = await _metaService.ProporMetaAsync(dto, clienteId: 99); // Outro cliente

            // Assert
            Assert.False(response.Success);
            Assert.Contains("Acesso negado", response.Message);
        }

        [Fact]
        public async Task AtualizarMeta_ProposedStatus_ShouldSucceed()
        {
            // Arrange
            var unit = new UnidadeConsumidora { UsuarioId = 10, CEP = "13480000" };
            await _unidadeRepo.AddAsync(unit);

            var device = new Dispositivo { UnidadeConsumidoraId = unit.Id, CategoriaId = 1, Nome = "Ar Split" };
            await _dispositivoRepo.AddAsync(device);

            var meta = new Meta { DispositivoId = device.Id, Status = MetaStatus.Proposta, ValorLimite = 100.0, Justificativa = "Original" };
            await _metaRepo.AddAsync(meta);

            var dto = new UpdateMetaRequestDTO
            {
                TipoMeta = TipoMeta.Financeira,
                ValorLimite = 50.0,
                Justificativa = "Atualizada"
            };

            // Act
            var response = await _metaService.AtualizarMetaAsync(meta.Id, dto, clienteId: 10);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal(50.0, response.Data.ValorLimite);
            Assert.Equal("Atualizada", response.Data.Justificativa);
            Assert.Equal("Financeira", response.Data.TipoMeta);
        }

        [Fact]
        public async Task AtualizarMeta_ApprovedStatus_ShouldFail()
        {
            // Arrange
            var unit = new UnidadeConsumidora { UsuarioId = 10, CEP = "13480000" };
            await _unidadeRepo.AddAsync(unit);

            var device = new Dispositivo { UnidadeConsumidoraId = unit.Id, CategoriaId = 1, Nome = "Ar Split" };
            await _dispositivoRepo.AddAsync(device);

            var meta = new Meta { DispositivoId = device.Id, Status = MetaStatus.Aprovada, ValorLimite = 100.0, Justificativa = "Original" };
            await _metaRepo.AddAsync(meta);

            var dto = new UpdateMetaRequestDTO
            {
                TipoMeta = TipoMeta.KWh,
                ValorLimite = 120.0,
                Justificativa = "Mais margem"
            };

            // Act
            var response = await _metaService.AtualizarMetaAsync(meta.Id, dto, clienteId: 10);

            // Assert
            Assert.False(response.Success);
            Assert.Contains("Apenas propostas de metas pendentes de avaliação ou devolvidas podem ser editadas", response.Message);
        }

        [Fact]
        public async Task AvaliarMeta_Operator_ShouldApproveSucceed()
        {
            // Arrange
            var meta = new Meta { DispositivoId = 1, Status = MetaStatus.Proposta, ValorLimite = 100.0, Justificativa = "Economia" };
            await _metaRepo.AddAsync(meta);

            var dto = new AvaliarMetaRequestDTO
            {
                Status = MetaStatus.Aprovada,
                AvaliacaoObs = "Meta aceitável e condizente com a categoria."
            };

            // Act
            var response = await _metaService.AvaliarMetaAsync(meta.Id, dto, operadorId: 5);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal("Aprovada", response.Data.Status);
            Assert.Equal(5, response.Data.OperadorId);
            Assert.Equal("Meta aceitável e condizente com a categoria.", response.Data.AvaliacaoObs);
        }

        // --- TESTES DE PROVISIONAMENTO DE CHAMADOS ---

        [Fact]
        public async Task ProvisionarChamado_InstallationTicket_ShouldLinkSensorAndFinalizeTicket()
        {
            // Arrange
            var unit = new UnidadeConsumidora { UsuarioId = 10 };
            await _unidadeRepo.AddAsync(unit);

            var device = new Dispositivo { UnidadeConsumidoraId = unit.Id, Nome = "Ar Condicionado" };
            await _dispositivoRepo.AddAsync(device);

            var sensor = new Sensor { ModeloSensor = "S-100", NumeroSerie = "SN777", Status = SensorStatus.Disponivel };
            await _sensorRepo.AddAsync(sensor);

            var chamado = new Chamado
            {
                ClienteId = 10,
                DispositivoId = device.Id,
                Tipo = TipoChamado.Instalacao,
                Status = ChamadoStatus.Pendente
            };
            await _chamadoRepo.AddAsync(chamado);

            var dto = new ProvisionarChamadoRequestDTO { SensorId = sensor.Id };

            // Act
            var response = await _chamadoService.ProvisionarChamadoAsync(chamado.Id, dto, requestUserId: 5);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal("Validado", response.Data.Status);
            Assert.Equal(5, response.Data.OperadorId);

            var updatedSensor = await _sensorRepo.GetByIdAsync(sensor.Id);
            Assert.NotNull(updatedSensor);
            Assert.Equal(device.Id, updatedSensor.DispositivoId);
            Assert.Equal(SensorStatus.EmUso, updatedSensor.Status);
        }

        [Fact]
        public async Task ProvisionarChamado_NonInstallationTicket_ShouldFail()
        {
            // Arrange
            var chamado = new Chamado
            {
                ClienteId = 10,
                DispositivoId = 1,
                Tipo = TipoChamado.Manutencao,
                Status = ChamadoStatus.Pendente
            };
            await _chamadoRepo.AddAsync(chamado);

            var dto = new ProvisionarChamadoRequestDTO { SensorId = 1 };

            // Act
            var response = await _chamadoService.ProvisionarChamadoAsync(chamado.Id, dto, requestUserId: 5);

            // Assert
            Assert.False(response.Success);
            Assert.Contains("Instalação", response.Message);
        }

        // --- TESTES DE RELATÓRIO TÉCNICO ---

        [Fact]
        public async Task CreateRelatorioTecnico_Operator_ShouldSucceed()
        {
            // Arrange
            var chamado = new Chamado { ClienteId = 10, DispositivoId = 1, Tipo = TipoChamado.Manutencao };
            await _chamadoRepo.AddAsync(chamado);

            var dto = new CreateRelatorioTecnicoRequestDTO
            {
                ChamadoId = chamado.Id,
                Conteudo = "Identificado sensor danificado por descarga elétrica. Substituído por modelo idêntico.",
                TipoOcorrencia = TipoOcorrencia.FalhaSensor
            };

            // Act
            var response = await _relatorioService.CreateRelatorioAsync(dto, operadorId: 5);

            // Assert
            Assert.True(response.Success);
            Assert.NotNull(response.Data);
            Assert.Equal(chamado.Id, response.Data.ChamadoId);
            Assert.Equal(5, response.Data.OperadorId);
            Assert.Equal("FalhaSensor", response.Data.TipoOcorrencia);
            Assert.Contains("descarga elétrica", response.Data.Conteudo);
        }

        // --- TESTES DE CONTROLE REMOTO ---

        [Fact]
        public async Task RemoteControl_LimitarECortar_ShouldSuspendDevice()
        {
            // Arrange
            var device = new Dispositivo { UnidadeConsumidoraId = 1, Nome = "Chuveiro Elétrico", Status = DispositivoStatus.Ativo };
            await _dispositivoRepo.AddAsync(device);

            // Act 1 - Limitar
            var resLimitar = await _dispositivoService.LimitarAsync(device.Id);
            // Assert 1
            Assert.True(resLimitar.Success);
            Assert.NotNull(resLimitar.Data);
            Assert.Equal("Suspenso", resLimitar.Data.Status);

            // Act 2 - Restaurar
            var resRestaurar = await _dispositivoService.RestaurarAsync(device.Id);
            // Assert 2
            Assert.True(resRestaurar.Success);
            Assert.NotNull(resRestaurar.Data);
            Assert.Equal("Ativo", resRestaurar.Data.Status);

            // Act 3 - Cortar
            var resCortar = await _dispositivoService.CortarAsync(device.Id);
            // Assert 3
            Assert.True(resCortar.Success);
            Assert.NotNull(resCortar.Data);
            Assert.Equal("Suspenso", resCortar.Data.Status);
        }
    }
}
