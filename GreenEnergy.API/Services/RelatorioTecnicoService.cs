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
        private readonly IDispositivoRepository _dispositivoRepository;
        private readonly IUnidadeConsumidoraRepository _unidadeRepository;

        public RelatorioTecnicoService(
            IRelatorioTecnicoRepository relatorioRepository,
            IChamadoRepository chamadoRepository,
            IDispositivoRepository dispositivoRepository,
            IUnidadeConsumidoraRepository unidadeRepository)
        {
            _relatorioRepository = relatorioRepository;
            _chamadoRepository = chamadoRepository;
            _dispositivoRepository = dispositivoRepository;
            _unidadeRepository = unidadeRepository;
        }

        public async Task<ApiResponse<RelatorioTecnicoResponseDTO>> CreateRelatorioAsync(CreateRelatorioTecnicoRequestDTO dto, int operadorId)
        {
            int chamadoId = 0;

            if (dto.ChamadoId.HasValue && dto.ChamadoId.Value > 0)
            {
                chamadoId = dto.ChamadoId.Value;
                var chamado = await _chamadoRepository.GetByIdAsync(chamadoId);
                if (chamado == null)
                {
                    return new ApiResponse<RelatorioTecnicoResponseDTO>("Chamado correspondente não encontrado.");
                }

                // Atualiza o status do chamado correspondente para Validado e atribui o operador
                chamado.Status = ChamadoStatus.Validado;
                chamado.OperadorId = operadorId;
                await _chamadoRepository.UpdateAsync(chamado);
            }
            else if (dto.DispositivoId.HasValue && dto.DispositivoId.Value > 0)
            {
                var dispositivo = await _dispositivoRepository.GetByIdAsync(dto.DispositivoId.Value);
                if (dispositivo == null)
                {
                    return new ApiResponse<RelatorioTecnicoResponseDTO>("Dispositivo correspondente não encontrado.");
                }

                // Procurar chamado ativo para o dispositivo
                var chamados = await _chamadoRepository.ListAllAsync();
                var chamadoAtivo = chamados.FirstOrDefault(c => c.DispositivoId == dispositivo.Id && 
                    (c.Status == ChamadoStatus.Pendente || c.Status == ChamadoStatus.EmAnalise));

                if (chamadoAtivo != null)
                {
                    chamadoId = chamadoAtivo.Id;
                    chamadoAtivo.Status = ChamadoStatus.Validado;
                    chamadoAtivo.OperadorId = operadorId;
                    await _chamadoRepository.UpdateAsync(chamadoAtivo);
                }
                else
                {
                    var unidade = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
                    if (unidade == null)
                    {
                        return new ApiResponse<RelatorioTecnicoResponseDTO>("Unidade consumidora associada ao dispositivo não encontrada.");
                    }

                    // Criar chamado automático
                    var novoChamado = new Chamado
                    {
                        ClienteId = unidade.UsuarioId,
                        OperadorId = operadorId,
                        DispositivoId = dispositivo.Id,
                        Tipo = TipoChamado.Manutencao,
                        Status = ChamadoStatus.Validado,
                        Descricao = "Chamado de manutenção aberto automaticamente para inserção de laudo técnico direto via painel do operador.",
                        CriadoEm = DateTime.UtcNow
                    };

                    await _chamadoRepository.AddAsync(novoChamado);
                    chamadoId = novoChamado.Id;
                }
            }
            else
            {
                return new ApiResponse<RelatorioTecnicoResponseDTO>("É necessário fornecer o ChamadoId ou o DispositivoId.");
            }

            var relatorio = new RelatorioTecnico
            {
                ChamadoId = chamadoId,
                OperadorId = operadorId,
                Conteudo = dto.Conteudo,
                TipoOcorrencia = dto.TipoOcorrencia,
                CriadoEm = DateTime.UtcNow
            };

            await _relatorioRepository.AddAsync(relatorio);

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

        public async Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListByDispositivoIdAsync(int dispositivoId)
        {
            var relatorios = await _relatorioRepository.ListAllAsync();
            var filtrados = relatorios.Where(r => r.Chamado != null && r.Chamado.DispositivoId == dispositivoId);
            return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>(filtrados.Select(MapToResponse));
        }

        private RelatorioTecnicoResponseDTO MapToResponse(RelatorioTecnico r)
        {
            return new RelatorioTecnicoResponseDTO
            {
                Id = r.Id,
                ChamadoId = r.ChamadoId,
                DispositivoId = r.Chamado != null ? r.Chamado.DispositivoId : null,
                DispositivoNome = r.Chamado != null && r.Chamado.Dispositivo != null ? r.Chamado.Dispositivo.Nome : string.Empty,
                OperadorId = r.OperadorId,
                OperadorNome = r.Operador != null ? r.Operador.Nome : string.Empty,
                Conteudo = r.Conteudo,
                TipoOcorrencia = r.TipoOcorrencia.ToString(),
                CriadoEm = r.CriadoEm
            };
        }
    }
}
