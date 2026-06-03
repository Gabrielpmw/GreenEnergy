using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class RelatorioTecnicoService : IRelatorioTecnicoService
    {
        private readonly IRelatorioTecnicoRepository _relatorioRepository;
        private readonly IChamadoRepository _chamadoRepository;

        public RelatorioTecnicoService(
            IRelatorioTecnicoRepository relatorioRepository,
            IChamadoRepository chamadoRepository)
        {
            _relatorioRepository = relatorioRepository;
            _chamadoRepository = chamadoRepository;
        }

        public async Task<ApiResponse<RelatorioTecnicoResponseDTO>> CreateRelatorioAsync(CreateRelatorioTecnicoRequestDTO dto, int operadorId)
        {
            var chamado = await _chamadoRepository.GetByIdAsync(dto.ChamadoId);
            if (chamado == null)
            {
                return new ApiResponse<RelatorioTecnicoResponseDTO>("Chamado correspondente não encontrado.");
            }

            var relatorio = new RelatorioTecnico
            {
                ChamadoId = dto.ChamadoId,
                OperadorId = operadorId,
                Conteudo = dto.Conteudo,
                TipoOcorrencia = dto.TipoOcorrencia,
                CriadoEm = DateTime.UtcNow
            };

            await _relatorioRepository.AddAsync(relatorio);

            // Atualiza o status do chamado correspondente para Validado e atribui o operador
            chamado.Status = ChamadoStatus.Validado;
            chamado.OperadorId = operadorId;
            await _chamadoRepository.UpdateAsync(chamado);

            // Recarregar relatorio para obter dados de navegação do operador
            var relatorioCarregado = await _relatorioRepository.GetByIdAsync(relatorio.Id);
            return new ApiResponse<RelatorioTecnicoResponseDTO>(MapToResponse(relatorioCarregado!), "Relatório técnico criado com sucesso!");
        }

        public async Task<ApiResponse<RelatorioTecnicoResponseDTO>> GetByIdAsync(int id)
        {
            var relatorio = await _relatorioRepository.GetByIdAsync(id);
            if (relatorio == null)
            {
                return new ApiResponse<RelatorioTecnicoResponseDTO>("Relatório técnico não encontrado.");
            }
            return new ApiResponse<RelatorioTecnicoResponseDTO>(MapToResponse(relatorio));
        }

        public async Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListAllAsync()
        {
            var relatorios = await _relatorioRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>(relatorios.Select(MapToResponse));
        }

        public async Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListByChamadoIdAsync(int chamadoId)
        {
            var chamado = await _chamadoRepository.GetByIdAsync(chamadoId);
            if (chamado == null)
            {
                return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>("Chamado correspondente não encontrado.");
            }

            var relatorios = await _relatorioRepository.ListByChamadoIdAsync(chamadoId);
            return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>(relatorios.Select(MapToResponse));
        }

        private RelatorioTecnicoResponseDTO MapToResponse(RelatorioTecnico r)
        {
            return new RelatorioTecnicoResponseDTO
            {
                Id = r.Id,
                ChamadoId = r.ChamadoId,
                OperadorId = r.OperadorId,
                OperadorNome = r.Operador != null ? r.Operador.Nome : string.Empty,
                Conteudo = r.Conteudo,
                TipoOcorrencia = r.TipoOcorrencia.ToString(),
                CriadoEm = r.CriadoEm
            };
        }
    }
}
