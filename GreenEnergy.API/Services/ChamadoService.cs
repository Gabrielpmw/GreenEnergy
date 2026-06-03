using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class ChamadoService : IChamadoService
    {
        private readonly IChamadoRepository _chamadoRepository;
        private readonly IDispositivoRepository _dispositivoRepository;
        private readonly ISensorRepository _sensorRepository;
        private readonly IUnidadeConsumidoraRepository _unidadeRepository;

        public ChamadoService(
            IChamadoRepository chamadoRepository,
            IDispositivoRepository dispositivoRepository,
            ISensorRepository sensorRepository,
            IUnidadeConsumidoraRepository unidadeRepository)
        {
            _chamadoRepository = chamadoRepository;
            _dispositivoRepository = dispositivoRepository;
            _sensorRepository = sensorRepository;
            _unidadeRepository = unidadeRepository;
        }

        public async Task<ApiResponse<ChamadoResponseDTO>> CreateChamadoAsync(CreateChamadoRequestDTO dto, int requestUserId)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(dto.DispositivoId);
            if (dispositivo == null)
            {
                return new ApiResponse<ChamadoResponseDTO>("Dispositivo não encontrado.");
            }

            var unidade = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
            if (unidade == null || unidade.UsuarioId != requestUserId)
            {
                return new ApiResponse<ChamadoResponseDTO>("Acesso negado. Você só pode abrir chamados para dispositivos associados às suas unidades consumidoras.");
            }

            var chamado = new Chamado
            {
                ClienteId = requestUserId,
                DispositivoId = dto.DispositivoId,
                Tipo = dto.Tipo,
                Status = ChamadoStatus.Pendente,
                Descricao = dto.Descricao,
                CriadoEm = DateTime.UtcNow
            };

            await _chamadoRepository.AddAsync(chamado);

            // Carregar dados adicionais de navegação para a resposta
            var chamadoCarregado = await _chamadoRepository.GetByIdAsync(chamado.Id);
            var responseDto = MapToResponse(chamadoCarregado!);

            return new ApiResponse<ChamadoResponseDTO>(responseDto, "Chamado aberto com sucesso!");
        }

        public async Task<ApiResponse<ChamadoResponseDTO>> GetByIdAsync(int id, int requestUserId, string requestUserRole)
        {
            var chamado = await _chamadoRepository.GetByIdAsync(id);
            if (chamado == null)
            {
                return new ApiResponse<ChamadoResponseDTO>("Chamado não encontrado.");
            }

            if (requestUserRole == "Cliente" && chamado.ClienteId != requestUserId)
            {
                return new ApiResponse<ChamadoResponseDTO>("Acesso negado. Você não possui permissão para visualizar este chamado.");
            }

            var dto = MapToResponse(chamado);
            return new ApiResponse<ChamadoResponseDTO>(dto);
        }

        public async Task<ApiResponse<IEnumerable<ChamadoResponseDTO>>> ListAllAsync(int requestUserId, string requestUserRole)
        {
            if (requestUserRole == "Cliente")
            {
                var chamadosCliente = await _chamadoRepository.ListByClienteIdAsync(requestUserId);
                return new ApiResponse<IEnumerable<ChamadoResponseDTO>>(chamadosCliente.Select(MapToResponse));
            }

            var todos = await _chamadoRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<ChamadoResponseDTO>>(todos.Select(MapToResponse));
        }

        public async Task<ApiResponse<ChamadoResponseDTO>> UpdateStatusAsync(int id, UpdateChamadoStatusRequestDTO dto, int requestUserId, string requestUserRole)
        {
            var chamado = await _chamadoRepository.GetByIdAsync(id);
            if (chamado == null)
            {
                return new ApiResponse<ChamadoResponseDTO>("Chamado não encontrado.");
            }

            // Apenas Operadores ou Admins podem alterar o status do chamado
            if (requestUserRole != "Admin" && requestUserRole != "Operador")
            {
                return new ApiResponse<ChamadoResponseDTO>("Acesso negado. Apenas administradores ou operadores podem atualizar o status de um chamado.");
            }

            chamado.Status = dto.Status;
            chamado.OperadorId = requestUserId;

            // Regra de Negócio: Se o chamado for de remoção e for VALIDADO, desativar dispositivo e liberar o sensor físico
            if (chamado.Tipo == TipoChamado.Remocao && dto.Status == ChamadoStatus.Validado)
            {
                var dispositivo = await _dispositivoRepository.GetByIdAsync(chamado.DispositivoId);
                if (dispositivo != null)
                {
                    dispositivo.IsActive = false;
                    dispositivo.IsDeleted = true;

                    if (dispositivo.Sensor != null)
                    {
                        var sensor = dispositivo.Sensor;
                        sensor.DispositivoId = null;
                        sensor.Status = SensorStatus.Disponivel;
                        await _sensorRepository.UpdateAsync(sensor);
                    }

                    await _dispositivoRepository.UpdateAsync(dispositivo);
                }
            }

            await _chamadoRepository.UpdateAsync(chamado);

            // Carrega novamente para obter detalhes atualizados do Operador
            var chamadoCarregado = await _chamadoRepository.GetByIdAsync(chamado.Id);
            var responseDto = MapToResponse(chamadoCarregado!);

            return new ApiResponse<ChamadoResponseDTO>(responseDto, "Status do chamado atualizado com sucesso.");
        }

        public async Task<ApiResponse<ChamadoResponseDTO>> ProvisionarChamadoAsync(int chamadoId, ProvisionarChamadoRequestDTO dto, int requestUserId)
        {
            var chamado = await _chamadoRepository.GetByIdAsync(chamadoId);
            if (chamado == null)
            {
                return new ApiResponse<ChamadoResponseDTO>("Chamado não encontrado.");
            }

            if (chamado.Tipo != TipoChamado.Instalacao)
            {
                return new ApiResponse<ChamadoResponseDTO>("Provisionamento é permitido apenas para chamados de Instalação.");
            }

            if (chamado.Status == ChamadoStatus.Validado)
            {
                return new ApiResponse<ChamadoResponseDTO>("Este chamado já foi concluído e validado.");
            }

            var sensor = await _sensorRepository.GetByIdAsync(dto.SensorId);
            if (sensor == null)
            {
                return new ApiResponse<ChamadoResponseDTO>("Sensor não encontrado.");
            }

            if (sensor.DispositivoId.HasValue && sensor.DispositivoId != chamado.DispositivoId)
            {
                return new ApiResponse<ChamadoResponseDTO>("Este sensor já está vinculado a outro dispositivo.");
            }

            if (sensor.Status != SensorStatus.Disponivel && sensor.DispositivoId != chamado.DispositivoId)
            {
                return new ApiResponse<ChamadoResponseDTO>("Apenas sensores com status 'Disponivel' podem ser vinculados.");
            }

            // Vincular sensor ao dispositivo do chamado
            sensor.DispositivoId = chamado.DispositivoId;
            sensor.Status = SensorStatus.EmUso;
            await _sensorRepository.UpdateAsync(sensor);

            // Finalizar o chamado
            chamado.Status = ChamadoStatus.Validado;
            chamado.OperadorId = requestUserId;
            await _chamadoRepository.UpdateAsync(chamado);

            var chamadoCarregado = await _chamadoRepository.GetByIdAsync(chamadoId);
            var responseDto = MapToResponse(chamadoCarregado!);

            return new ApiResponse<ChamadoResponseDTO>(responseDto, "Chamado provisionado e finalizado com sucesso!");
        }

        private ChamadoResponseDTO MapToResponse(Chamado c)
        {
            return new ChamadoResponseDTO
            {
                Id = c.Id,
                ClienteId = c.ClienteId,
                ClienteNome = c.Cliente != null ? c.Cliente.Nome : string.Empty,
                OperadorId = c.OperadorId,
                OperadorNome = c.Operador != null ? c.Operador.Nome : null,
                DispositivoId = c.DispositivoId,
                DispositivoNome = c.Dispositivo != null ? c.Dispositivo.Nome : string.Empty,
                Tipo = c.Tipo.ToString(),
                Status = c.Status.ToString(),
                Descricao = c.Descricao,
                CriadoEm = c.CriadoEm
            };
        }
    }
}
