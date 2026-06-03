using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class DispositivoService : IDispositivoService
    {
        private readonly IDispositivoRepository _dispositivoRepository;
        private readonly IUnidadeConsumidoraRepository _unidadeRepository;
        private readonly ICategoriaAparelhoRepository _categoriaRepository;
        private readonly ISensorRepository _sensorRepository;
        private readonly IAnotacaoDispositivoRepository _anotacaoRepository;

        public DispositivoService(
            IDispositivoRepository dispositivoRepository,
            IUnidadeConsumidoraRepository unidadeRepository,
            ICategoriaAparelhoRepository categoriaRepository,
            ISensorRepository sensorRepository,
            IAnotacaoDispositivoRepository anotacaoRepository)
        {
            _dispositivoRepository = dispositivoRepository;
            _unidadeRepository = unidadeRepository;
            _categoriaRepository = categoriaRepository;
            _sensorRepository = sensorRepository;
            _anotacaoRepository = anotacaoRepository;
        }

        public async Task<ApiResponse<DispositivoResponseDTO>> CreateDispositivoAsync(CreateDispositivoRequestDTO dto, int requestUserId, string requestUserRole)
        {
            var unidade = await _unidadeRepository.GetByIdAsync(dto.UnidadeConsumidoraId);
            if (unidade == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Unidade Consumidora não encontrada.");
            }

            if (requestUserRole == "Cliente" && unidade.UsuarioId != requestUserId)
            {
                return new ApiResponse<DispositivoResponseDTO>("Acesso negado. Você só pode cadastrar dispositivos nas suas próprias unidades.");
            }

            var categoria = await _categoriaRepository.GetByIdAsync(dto.CategoriaId);
            if (categoria == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Categoria de aparelho não encontrada.");
            }

            var dispositivo = new Dispositivo
            {
                UnidadeConsumidoraId = dto.UnidadeConsumidoraId,
                CategoriaId = dto.CategoriaId,
                Nome = dto.Nome,
                TipoAparelho = dto.TipoAparelho,
                Descricao = dto.Descricao,
                PotenciaWatts = dto.PotenciaWatts,
                Status = DispositivoStatus.Ativo,
                CriadoEm = DateTime.UtcNow
            };

            await _dispositivoRepository.AddAsync(dispositivo);

            var responseDto = MapToResponse(dispositivo);
            return new ApiResponse<DispositivoResponseDTO>(responseDto, "Dispositivo cadastrado com sucesso!");
        }

        public async Task<ApiResponse<DispositivoResponseDTO>> GetByIdAsync(int id, int requestUserId, string requestUserRole)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(id);
            if (dispositivo == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Dispositivo não encontrado.");
            }

            var unidade = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
            if (unidade == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Unidade Consumidora associada ao dispositivo não encontrada.");
            }

            if (requestUserRole == "Cliente" && unidade.UsuarioId != requestUserId)
            {
                return new ApiResponse<DispositivoResponseDTO>("Acesso negado. Você não possui permissão para visualizar este dispositivo.");
            }

            var dto = MapToResponse(dispositivo);
            return new ApiResponse<DispositivoResponseDTO>(dto);
        }

        public async Task<ApiResponse<IEnumerable<DispositivoResponseDTO>>> ListAllAsync(int requestUserId, string requestUserRole)
        {
            if (requestUserRole == "Cliente")
            {
                var unidades = await _unidadeRepository.ListByUsuarioIdAsync(requestUserId);
                var dispositivosCliente = new List<Dispositivo>();
                foreach (var u in unidades)
                {
                    var disp = await _dispositivoRepository.ListByUnidadeConsumidoraIdAsync(u.Id);
                    dispositivosCliente.AddRange(disp);
                }
                return new ApiResponse<IEnumerable<DispositivoResponseDTO>>(dispositivosCliente.Select(MapToResponse));
            }

            var todos = await _dispositivoRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<DispositivoResponseDTO>>(todos.Select(MapToResponse));
        }

        public async Task<ApiResponse<IEnumerable<DispositivoResponseDTO>>> ListByUnidadeConsumidoraIdAsync(int unidadeId, int requestUserId, string requestUserRole)
        {
            var unidade = await _unidadeRepository.GetByIdAsync(unidadeId);
            if (unidade == null)
            {
                return new ApiResponse<IEnumerable<DispositivoResponseDTO>>("Unidade Consumidora não encontrada.");
            }

            if (requestUserRole == "Cliente" && unidade.UsuarioId != requestUserId)
            {
                return new ApiResponse<IEnumerable<DispositivoResponseDTO>>("Acesso negado. Você não é o proprietário desta unidade consumidora.");
            }

            var disp = await _dispositivoRepository.ListByUnidadeConsumidoraIdAsync(unidadeId);
            return new ApiResponse<IEnumerable<DispositivoResponseDTO>>(disp.Select(MapToResponse));
        }

        public async Task<ApiResponse<DispositivoResponseDTO>> UpdateAsync(int id, UpdateDispositivoRequestDTO dto, int requestUserId, string requestUserRole)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(id);
            if (dispositivo == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Dispositivo não encontrado.");
            }

            var unidade = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
            if (unidade == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Unidade Consumidora não encontrada.");
            }

            if (requestUserRole == "Cliente" && unidade.UsuarioId != requestUserId)
            {
                return new ApiResponse<DispositivoResponseDTO>("Acesso negado. Apenas o proprietário do dispositivo pode atualizá-lo.");
            }

            dispositivo.Nome = dto.Nome;
            dispositivo.TipoAparelho = dto.TipoAparelho;
            dispositivo.Descricao = dto.Descricao;
            dispositivo.PotenciaWatts = dto.PotenciaWatts;

            await _dispositivoRepository.UpdateAsync(dispositivo);

            var responseDto = MapToResponse(dispositivo);
            return new ApiResponse<DispositivoResponseDTO>(responseDto, "Dispositivo atualizado com sucesso!");
        }

        public async Task<ApiResponse<bool>> DesativarAsync(int id)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(id);
            if (dispositivo == null)
            {
                return new ApiResponse<bool>("Dispositivo não encontrado.");
            }

            dispositivo.IsActive = false;
            dispositivo.IsDeleted = true;

            // Se houver sensor vinculado, desvincula e o devolve para Disponivel
            if (dispositivo.Sensor != null)
            {
                var sensor = dispositivo.Sensor;
                sensor.DispositivoId = null;
                sensor.Status = SensorStatus.Disponivel;
                await _sensorRepository.UpdateAsync(sensor);
            }

            await _dispositivoRepository.UpdateAsync(dispositivo);
            return new ApiResponse<bool>(true, "Dispositivo desativado e sensores vinculados foram devolvidos ao estoque.");
        }

        public async Task<ApiResponse<bool>> VincularSensorAsync(int dispositivoId, int sensorId)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(dispositivoId);
            if (dispositivo == null)
            {
                return new ApiResponse<bool>("Dispositivo não encontrado.");
            }

            var sensor = await _sensorRepository.GetByIdAsync(sensorId);
            if (sensor == null)
            {
                return new ApiResponse<bool>("Sensor não encontrado.");
            }

            if (sensor.DispositivoId.HasValue && sensor.DispositivoId != dispositivoId)
            {
                return new ApiResponse<bool>("Este sensor já está vinculado a outro dispositivo.");
            }

            if (sensor.Status != SensorStatus.Disponivel && sensor.DispositivoId != dispositivoId)
            {
                return new ApiResponse<bool>("Apenas sensores com status 'Disponivel' podem ser vinculados.");
            }

            // Se o dispositivo já tiver outro sensor vinculado, desvincule-o primeiro
            if (dispositivo.Sensor != null && dispositivo.Sensor.Id != sensorId)
            {
                var sensorAntigo = dispositivo.Sensor;
                sensorAntigo.DispositivoId = null;
                sensorAntigo.Status = SensorStatus.Disponivel;
                await _sensorRepository.UpdateAsync(sensorAntigo);
            }

            sensor.DispositivoId = dispositivoId;
            sensor.Status = SensorStatus.EmUso;

            await _sensorRepository.UpdateAsync(sensor);
            return new ApiResponse<bool>(true, "Sensor vinculado com sucesso ao dispositivo.");
        }

        public async Task<ApiResponse<bool>> DesvincularSensorAsync(int dispositivoId)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(dispositivoId);
            if (dispositivo == null)
            {
                return new ApiResponse<bool>("Dispositivo não encontrado.");
            }

            if (dispositivo.Sensor == null)
            {
                return new ApiResponse<bool>("Este dispositivo não possui nenhum sensor vinculado.");
            }

            var sensor = dispositivo.Sensor;
            sensor.DispositivoId = null;
            sensor.Status = SensorStatus.Disponivel;

            await _sensorRepository.UpdateAsync(sensor);
            return new ApiResponse<bool>(true, "Sensor desvinculado com sucesso e devolvido ao almoxarifado.");
        }

        // --- ANOTAÇÕES ---

        public async Task<ApiResponse<AnotacaoDispositivoResponseDTO>> AddAnotacaoAsync(int dispositivoId, CreateAnotacaoDispositivoRequestDTO dto, int requestUserId)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(dispositivoId);
            if (dispositivo == null)
            {
                return new ApiResponse<AnotacaoDispositivoResponseDTO>("Dispositivo não encontrado.");
            }

            var unidade = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
            if (unidade == null || unidade.UsuarioId != requestUserId)
            {
                return new ApiResponse<AnotacaoDispositivoResponseDTO>("Acesso negado. Você só pode adicionar anotações em dispositivos de sua propriedade.");
            }

            var anotacao = new AnotacaoDispositivo
            {
                DispositivoId = dispositivoId,
                ClienteId = requestUserId,
                Conteudo = dto.Conteudo,
                CriadoEm = DateTime.UtcNow
            };

            await _anotacaoRepository.AddAsync(anotacao);

            // Carrega novamente para obter o nome do Cliente
            var anotacaoCarregada = await _anotacaoRepository.GetByIdAsync(anotacao.Id);
            var responseDto = MapAnotacaoToResponse(anotacaoCarregada!);

            return new ApiResponse<AnotacaoDispositivoResponseDTO>(responseDto, "Anotação registrada com sucesso!");
        }

        public async Task<ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>> ListAnotacoesAsync(int dispositivoId, int requestUserId, string requestUserRole)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(dispositivoId);
            if (dispositivo == null)
            {
                return new ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>("Dispositivo não encontrado.");
            }

            var unidade = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
            if (unidade == null)
            {
                return new ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>("Unidade Consumidora não encontrada.");
            }

            if (requestUserRole == "Cliente" && unidade.UsuarioId != requestUserId)
            {
                return new ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>("Acesso negado. Você não é o proprietário do dispositivo.");
            }

            var anotacoes = await _anotacaoRepository.ListByDispositivoIdAsync(dispositivoId);
            return new ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>(anotacoes.Select(MapAnotacaoToResponse));
        }

        public async Task<ApiResponse<AnotacaoDispositivoResponseDTO>> UpdateAnotacaoAsync(int anotacaoId, UpdateAnotacaoDispositivoRequestDTO dto, int requestUserId)
        {
            var anotacao = await _anotacaoRepository.GetByIdAsync(anotacaoId);
            if (anotacao == null)
            {
                return new ApiResponse<AnotacaoDispositivoResponseDTO>("Anotação não encontrada.");
            }

            if (anotacao.ClienteId != requestUserId)
            {
                return new ApiResponse<AnotacaoDispositivoResponseDTO>("Acesso negado. Você só pode atualizar suas próprias anotações.");
            }

            anotacao.Conteudo = dto.Conteudo;
            await _anotacaoRepository.UpdateAsync(anotacao);

            var responseDto = MapAnotacaoToResponse(anotacao);
            return new ApiResponse<AnotacaoDispositivoResponseDTO>(responseDto, "Anotação atualizada com sucesso.");
        }

        public async Task<ApiResponse<bool>> DesativarAnotacaoAsync(int anotacaoId, int requestUserId)
        {
            var anotacao = await _anotacaoRepository.GetByIdAsync(anotacaoId);
            if (anotacao == null)
            {
                return new ApiResponse<bool>("Anotação não encontrada.");
            }

            if (anotacao.ClienteId != requestUserId)
            {
                return new ApiResponse<bool>("Acesso negado. Você só pode excluir suas próprias anotações.");
            }

            anotacao.IsActive = false;
            anotacao.IsDeleted = true;

            await _anotacaoRepository.UpdateAsync(anotacao);
            return new ApiResponse<bool>(true, "Anotação excluída com sucesso.");
        }

        private DispositivoResponseDTO MapToResponse(Dispositivo d)
        {
            return new DispositivoResponseDTO
            {
                Id = d.Id,
                UnidadeConsumidoraId = d.UnidadeConsumidoraId,
                CategoriaId = d.CategoriaId,
                CategoriaNome = d.Categoria != null ? d.Categoria.Nome : string.Empty,
                Nome = d.Nome,
                TipoAparelho = d.TipoAparelho,
                Descricao = d.Descricao,
                PotenciaWatts = d.PotenciaWatts,
                Status = d.Status.ToString(),
                CriadoEm = d.CriadoEm,
                Sensor = d.Sensor != null ? new SensorResponseDTO
                {
                    Id = d.Sensor.Id,
                    DispositivoId = d.Sensor.DispositivoId,
                    DispositivoNome = d.Nome,
                    ModeloSensor = d.Sensor.ModeloSensor,
                    NumeroSerie = d.Sensor.NumeroSerie,
                    Status = d.Sensor.Status.ToString(),
                    UltimoSinal = d.Sensor.UltimoSinal
                } : null
            };
        }

        private AnotacaoDispositivoResponseDTO MapAnotacaoToResponse(AnotacaoDispositivo a)
        {
            return new AnotacaoDispositivoResponseDTO
            {
                Id = a.Id,
                DispositivoId = a.DispositivoId,
                ClienteId = a.ClienteId,
                ClienteNome = a.Cliente != null ? a.Cliente.Nome : string.Empty,
                Conteudo = a.Conteudo,
                CriadoEm = a.CriadoEm
            };
        }

        public async Task<ApiResponse<DispositivoResponseDTO>> LimitarAsync(int id)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(id);
            if (dispositivo == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Dispositivo não encontrado.");
            }

            dispositivo.Status = DispositivoStatus.Suspenso;
            await _dispositivoRepository.UpdateAsync(dispositivo);

            var response = MapToResponse(dispositivo);
            return new ApiResponse<DispositivoResponseDTO>(response, "Fornecimento de energia do dispositivo limitado com sucesso.");
        }

        public async Task<ApiResponse<DispositivoResponseDTO>> CortarAsync(int id)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(id);
            if (dispositivo == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Dispositivo não encontrado.");
            }

            dispositivo.Status = DispositivoStatus.Suspenso;
            await _dispositivoRepository.UpdateAsync(dispositivo);

            var response = MapToResponse(dispositivo);
            return new ApiResponse<DispositivoResponseDTO>(response, "Fornecimento de energia do dispositivo cortado com sucesso.");
        }

        public async Task<ApiResponse<DispositivoResponseDTO>> RestaurarAsync(int id)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(id);
            if (dispositivo == null)
            {
                return new ApiResponse<DispositivoResponseDTO>("Dispositivo não encontrado.");
            }

            dispositivo.Status = DispositivoStatus.Ativo;
            await _dispositivoRepository.UpdateAsync(dispositivo);

            var response = MapToResponse(dispositivo);
            return new ApiResponse<DispositivoResponseDTO>(response, "Fornecimento de energia do dispositivo restaurado com sucesso.");
        }
    }
}
