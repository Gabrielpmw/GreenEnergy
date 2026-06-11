using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class AuditLogRepository : IAuditLogRepository
    {
        private readonly ApplicationDbContext _context;

        public AuditLogRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(AuditLog log)
        {
            await _context.AuditLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AuditLog>> ListFilteredAsync(string? role, DateTime? start, DateTime? end, string? acao, string? entidade)
        {
            var query = _context.AuditLogs
                .Include(a => a.Usuario)
                .AsQueryable();

            if (!string.IsNullOrEmpty(role))
            {
                if (Enum.TryParse<UsuarioRole>(role, true, out var roleEnum))
                {
                    query = query.Where(a => a.Usuario != null && a.Usuario.Role == roleEnum);
                }
            }

            if (start.HasValue)
            {
                query = query.Where(a => a.Timestamp >= start.Value);
            }

            if (end.HasValue)
            {
                query = query.Where(a => a.Timestamp <= end.Value);
            }

            if (!string.IsNullOrEmpty(acao))
            {
                query = query.Where(a => a.Acao.Contains(acao));
            }

            if (!string.IsNullOrEmpty(entidade))
            {
                query = query.Where(a => a.Entidade.Contains(entidade));
            }

            return await query
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();
        }
    }
}
