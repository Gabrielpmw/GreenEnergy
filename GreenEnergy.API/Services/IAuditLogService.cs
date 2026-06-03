using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IAuditLogService
    {
        Task<ApiResponse<IEnumerable<AuditLogResponseDTO>>> ListFilteredAsync(string? role, DateTime? start, DateTime? end, string? acao, string? entidade);
    }
}
