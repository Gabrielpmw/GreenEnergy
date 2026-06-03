using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class RelatorioTecnicoRepository : IRelatorioTecnicoRepository
    {
        private readonly ApplicationDbContext _context;

        public RelatorioTecnicoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<RelatorioTecnico?> GetByIdAsync(int id)
        {
            return await _context.RelatoriosTecnicos
                .Include(r => r.Chamado)
                .Include(r => r.Operador)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<IEnumerable<RelatorioTecnico>> ListAllAsync()
        {
            return await _context.RelatoriosTecnicos
                .Include(r => r.Chamado)
                .Include(r => r.Operador)
                .ToListAsync();
        }

        public async Task<IEnumerable<RelatorioTecnico>> ListByChamadoIdAsync(int chamadoId)
        {
            return await _context.RelatoriosTecnicos
                .Include(r => r.Chamado)
                .Include(r => r.Operador)
                .Where(r => r.ChamadoId == chamadoId)
                .ToListAsync();
        }

        public async Task AddAsync(RelatorioTecnico relatorio)
        {
            await _context.RelatoriosTecnicos.AddAsync(relatorio);
            await _context.SaveChangesAsync();
        }
    }
}
