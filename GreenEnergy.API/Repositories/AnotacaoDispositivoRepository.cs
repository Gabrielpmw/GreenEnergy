using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class AnotacaoDispositivoRepository : IAnotacaoDispositivoRepository
    {
        private readonly ApplicationDbContext _context;

        public AnotacaoDispositivoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AnotacaoDispositivo?> GetByIdAsync(int id)
        {
            return await _context.AnotacoesDispositivos
                .Include(a => a.Cliente)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<IEnumerable<AnotacaoDispositivo>> ListByDispositivoIdAsync(int dispositivoId)
        {
            return await _context.AnotacoesDispositivos
                .Include(a => a.Cliente)
                .Where(a => a.DispositivoId == dispositivoId)
                .ToListAsync();
        }

        public async Task AddAsync(AnotacaoDispositivo anotacao)
        {
            await _context.AnotacoesDispositivos.AddAsync(anotacao);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(AnotacaoDispositivo anotacao)
        {
            _context.AnotacoesDispositivos.Update(anotacao);
            await _context.SaveChangesAsync();
        }
    }
}
