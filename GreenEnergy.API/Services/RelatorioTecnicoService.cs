using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Data;
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
        private readonly ApplicationDbContext? _context;

        public RelatorioTecnicoService(
            IRelatorioTecnicoRepository relatorioRepository,
            IChamadoRepository chamadoRepository,
            IDispositivoRepository dispositivoRepository,
            IUnidadeConsumidoraRepository unidadeRepository,
            ApplicationDbContext? context = null)
        {
            _relatorioRepository = relatorioRepository;
            _chamadoRepository = chamadoRepository;
            _dispositivoRepository = dispositivoRepository;
            _unidadeRepository = unidadeRepository;
            _context = context;
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
                Descricao = dto.Descricao,
                SolucaoRecomendada = dto.SolucaoRecomendada,
                TipoOcorrencia = dto.TipoOcorrencia,
                CriadoEm = DateTime.UtcNow
            };

            await _relatorioRepository.AddAsync(relatorio);

            // Buscar chamado completo para obter dados de cliente e dispositivo para disparar o Alerta
            var chamadoFinal = await _chamadoRepository.GetByIdAsync(chamadoId);
            if (chamadoFinal != null && _context != null)
            {
                var nomeDispositivo = chamadoFinal.Dispositivo?.Nome ?? "Dispositivo";
                string ocorrenciaFormatada = dto.TipoOcorrencia switch
                {
                    TipoOcorrencia.FalhaSensor => "Falha do Sensor",
                    TipoOcorrencia.ExcessoConsumo => "Excesso de Consumo",
                    _ => "Manutenção Recomendada"
                };

                var alerta = new Alerta
                {
                    UsuarioId = chamadoFinal.ClienteId,
                    DispositivoId = chamadoFinal.DispositivoId,
                    Mensagem = $"Novo laudo técnico emitido para o dispositivo '{nomeDispositivo}'. Ocorrência: {ocorrenciaFormatada}. Problema: {dto.Descricao}. Solução recomendada: {dto.SolucaoRecomendada}.",
                    Tipo = TipoAlerta.Informativo,
                    Lido = false,
                    GeradoEm = DateTime.UtcNow
                };

                await _context.Alertas.AddAsync(alerta);
                await _context.SaveChangesAsync();
            }

            // Recarregar relatorio para obter dados de navegação do operador
            var relatorioCarregado = await _relatorioRepository.GetByIdAsync(relatorio.Id);
            return new ApiResponse<RelatorioTecnicoResponseDTO>(MapToResponse(relatorioCarregado!), "Relatório técnico criado com sucesso!");
        }

        public async Task<ApiResponse<RelatorioTecnicoResponseDTO>> GetByIdAsync(int id, int requestUserId, string requestUserRole)
        {
            var relatorio = await _relatorioRepository.GetByIdAsync(id);
            if (relatorio == null)
            {
                return new ApiResponse<RelatorioTecnicoResponseDTO>("Relatório técnico não encontrado.");
            }

            if (requestUserRole == "Cliente")
            {
                var chamado = await _chamadoRepository.GetByIdAsync(relatorio.ChamadoId);
                if (chamado == null || chamado.ClienteId != requestUserId)
                {
                    return new ApiResponse<RelatorioTecnicoResponseDTO>("Acesso negado. Você não possui permissão para visualizar este relatório técnico.");
                }
            }

            return new ApiResponse<RelatorioTecnicoResponseDTO>(MapToResponse(relatorio));
        }

        public async Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListAllAsync()
        {
            var relatorios = await _relatorioRepository.ListAllAsync();
            return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>(relatorios.Select(MapToResponse));
        }

        public async Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListByChamadoIdAsync(int chamadoId, int requestUserId, string requestUserRole)
        {
            var chamado = await _chamadoRepository.GetByIdAsync(chamadoId);
            if (chamado == null)
            {
                return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>("Chamado correspondente não encontrado.");
            }

            if (requestUserRole == "Cliente" && chamado.ClienteId != requestUserId)
            {
                return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>("Acesso negado. Você não possui permissão para visualizar este chamado.");
            }

            var relatorios = await _relatorioRepository.ListByChamadoIdAsync(chamadoId);
            return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>(relatorios.Select(MapToResponse));
        }

        public async Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListByDispositivoIdAsync(int dispositivoId, int requestUserId, string requestUserRole)
        {
            var dispositivo = await _dispositivoRepository.GetByIdAsync(dispositivoId);
            if (dispositivo == null)
            {
                return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>("Dispositivo correspondente não encontrado.");
            }

            if (requestUserRole == "Cliente")
            {
                var uc = await _unidadeRepository.GetByIdAsync(dispositivo.UnidadeConsumidoraId);
                if (uc == null || uc.UsuarioId != requestUserId)
                {
                    return new ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>("Acesso negado. Você não possui permissão para visualizar os laudos deste dispositivo.");
                }
            }

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
                Descricao = r.Descricao,
                SolucaoRecomendada = r.SolucaoRecomendada,
                TipoOcorrencia = r.TipoOcorrencia.ToString(),
                CriadoEm = r.CriadoEm
            };
        }
    }
}
