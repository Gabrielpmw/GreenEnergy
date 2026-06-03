using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;
using GreenEnergy.API.Repositories;

namespace GreenEnergy.API.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IAuditLogRepository _auditLogRepository;

        public AuditLogService(IAuditLogRepository auditLogRepository)
        {
            _auditLogRepository = auditLogRepository;
        }

        public async Task<ApiResponse<IEnumerable<AuditLogResponseDTO>>> ListFilteredAsync(string? role, DateTime? start, DateTime? end, string? acao, string? entidade)
        {
            var logs = await _auditLogRepository.ListFilteredAsync(role, start, end, acao, entidade);
            return new ApiResponse<IEnumerable<AuditLogResponseDTO>>(logs.Select(MapToResponse));
        }

        private AuditLogResponseDTO MapToResponse(AuditLog a)
        {
            return new AuditLogResponseDTO
            {
                Id = a.Id,
                UsuarioId = a.UsuarioId,
                UsuarioNome = a.Usuario?.Nome,
                UsuarioRole = a.Usuario?.Role.ToString(),
                Acao = a.Acao,
                Entidade = a.Entidade,
                EntidadeId = a.EntidadeId,
                DadosAnteriores = a.DadosAnteriores,
                DadosNovos = a.DadosNovos,
                IP = a.IP,
                Timestamp = a.Timestamp
            };
        }
    }
}
