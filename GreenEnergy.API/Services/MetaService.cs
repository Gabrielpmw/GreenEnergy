using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class MetaService : IMetaService
    {
        private readonly IMetaRepository _metaRepository;
        private readonly IDispositivoRepository _dispositivoRepository;
        private readonly IUnidadeConsumidoraRepository _unidadeRepository;

        public MetaService(
            IMetaRepository metaRepository,
            IDispositivoRepository dispositivoRepository,
            IUnidadeConsumidoraRepository unidadeRepository)
        {
            _metaRepository = metaRepository;
            _dispositivoRepository = dispositivoRepository;
            _unidadeRepository = unidadeRepository;
        }

        public async Task<ApiResponse<MetaResponseDTO>> ProporMetaAsync(CreateMetaRequestDTO dto, int clienteId)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(dto.DispositivoId);
            if (dispositivo == null)
            {
                return new ApiResponse<MetaResponseDTO>("Dispositivo não encontrado.");
            }

            var unidade = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
            if (unidade == null || unidade.UsuarioId != clienteId)
            {
                return new ApiResponse<MetaResponseDTO>("Acesso negado. Você só pode propor metas para dispositivos de suas unidades consumidoras.");
            }

            var meta = new Meta
            {
                DispositivoId = dto.DispositivoId,
                TipoMeta = dto.TipoMeta,
                ValorLimite = dto.ValorLimite,
                Justificativa = dto.Justificativa,
                Status = MetaStatus.Proposta
            };

            await _metaRepository.AddAsync(meta);

            // Recarregar com navegações
            var metaCarregada = await _metaRepository.GetByIdAsync(meta.Id);
            return new ApiResponse<MetaResponseDTO>(MapToResponse(metaCarregada!), "Proposta de meta enviada com sucesso!");
        }

        public async Task<ApiResponse<MetaResponseDTO>> AtualizarMetaAsync(int id, UpdateMetaRequestDTO dto, int clienteId)
        {
            var meta = await _metaRepository.GetByIdAsync(id);
            if (meta == null)
            {
                return new ApiResponse<MetaResponseDTO>("Meta não encontrada.");
            }

            var dispositivo = await _dispositivoRepository.GetByIdAsync(meta.DispositivoId);
            var unidade = await _unidadeRepository.GetByIdAsync(dispositivo!.UnidadeConsumidoraId);

            if (unidade == null || unidade.UsuarioId != clienteId)
            {
                return new ApiResponse<MetaResponseDTO>("Acesso negado. Você não é o proprietário do dispositivo associado a esta meta.");
            }

            if (meta.Status != MetaStatus.Proposta && meta.Status != MetaStatus.Devolvida)
            {
                return new ApiResponse<MetaResponseDTO>("Apenas propostas de metas pendentes de avaliação ou devolvidas podem ser editadas.");
            }

            meta.TipoMeta = dto.TipoMeta;
            meta.ValorLimite = dto.ValorLimite;
            meta.Justificativa = dto.Justificativa;
            meta.Status = MetaStatus.Proposta; // Reseta para Proposta para nova avaliação

            await _metaRepository.UpdateAsync(meta);

            var metaCarregada = await _metaRepository.GetByIdAsync(meta.Id);
            return new ApiResponse<MetaResponseDTO>(MapToResponse(metaCarregada!), "Proposta de meta atualizada com sucesso!");
        }

        public async Task<ApiResponse<MetaResponseDTO>> AvaliarMetaAsync(int id, AvaliarMetaRequestDTO dto, int operadorId)
        {
            var meta = await _metaRepository.GetByIdAsync(id);
            if (meta == null)
            {
                return new ApiResponse<MetaResponseDTO>("Meta não encontrada.");
            }

            if (dto.Status == MetaStatus.Proposta)
            {
                return new ApiResponse<MetaResponseDTO>("O status da avaliação deve ser Aprovada ou Devolvida.");
            }

            meta.Status = dto.Status;
            meta.OperadorId = operadorId;
            meta.AvaliacaoObs = dto.AvaliacaoObs;

            await _metaRepository.UpdateAsync(meta);

            var metaCarregada = await _metaRepository.GetByIdAsync(meta.Id);
            return new ApiResponse<MetaResponseDTO>(MapToResponse(metaCarregada!), "Meta avaliada com sucesso.");
        }

        public async Task<ApiResponse<MetaResponseDTO>> GetByIdAsync(int id, int userId, string userRole)
        {
            var meta = await _metaRepository.GetByIdAsync(id);
            if (meta == null)
            {
                return new ApiResponse<MetaResponseDTO>("Meta não encontrada.");
            }

            if (userRole == "Cliente")
            {
                var dispositivo = await _dispositivoRepository.GetByIdAsync(meta.DispositivoId);
                var unidade = await _unidadeRepository.GetByIdAsync(dispositivo!.UnidadeConsumidoraId);
                if (unidade == null || unidade.UsuarioId != userId)
                {
                    return new ApiResponse<MetaResponseDTO>("Acesso negado. Você não possui permissão para visualizar esta meta.");
                }
            }

            return new ApiResponse<MetaResponseDTO>(MapToResponse(meta));
        }

        public async Task<ApiResponse<IEnumerable<MetaResponseDTO>>> ListAllAsync()
        {
            var metas = await _metaRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<MetaResponseDTO>>(metas.Select(MapToResponse));
        }

        public async Task<ApiResponse<IEnumerable<MetaResponseDTO>>> ListByDispositivoIdAsync(int dispositivoId, int userId, string userRole)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(dispositivoId);
            if (dispositivo == null)
            {
                return new ApiResponse<IEnumerable<MetaResponseDTO>>("Dispositivo não encontrado.");
            }

            if (userRole == "Cliente")
            {
                var unidade = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
                if (unidade == null || unidade.UsuarioId != userId)
                {
                    return new ApiResponse<IEnumerable<MetaResponseDTO>>("Acesso negado. Você não possui permissão para visualizar as metas deste dispositivo.");
                }
            }

            var metas = await _metaRepository.ListByDispositivoIdAsync(dispositivoId);
            return new ApiResponse<IEnumerable<MetaResponseDTO>>(metas.Select(MapToResponse));
        }

        private MetaResponseDTO MapToResponse(Meta m)
        {
            return new MetaResponseDTO
            {
                Id = m.Id,
                DispositivoId = m.DispositivoId,
                DispositivoNome = m.Dispositivo != null ? m.Dispositivo.Nome : string.Empty,
                OperadorId = m.OperadorId,
                OperadorNome = m.Operador != null ? m.Operador.Nome : null,
                TipoMeta = m.TipoMeta.ToString(),
                ValorLimite = m.ValorLimite,
                Justificativa = m.Justificativa,
                Status = m.Status.ToString(),
                AvaliacaoObs = m.AvaliacaoObs
            };
        }
    }
}
