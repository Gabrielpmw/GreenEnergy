using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IAuditLogRepository
    {
        Task AddAsync(AuditLog log);
        Task<IEnumerable<AuditLog>> ListFilteredAsync(string? role, DateTime? start, DateTime? end, string? acao, string? entidade);
    }
}
