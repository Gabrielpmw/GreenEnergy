using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class MetaRepository : IMetaRepository
    {
        private readonly ApplicationDbContext _context;

        public MetaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Meta?> GetByIdAsync(int id)
        {
            return await _context.Metas
                .Include(m => m.Dispositivo)
                    .ThenInclude(d => d.UnidadeConsumidora)
                .Include(m => m.Operador)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<Meta>> ListAllAsync()
        {
            return await _context.Metas
                .Include(m => m.Dispositivo)
                .Include(m => m.Operador)
                .ToListAsync();
        }

        public async Task<IEnumerable<Meta>> ListByDispositivoIdAsync(int dispositivoId)
        {
            return await _context.Metas
                .Include(m => m.Dispositivo)
                .Include(m => m.Operador)
                .Where(m => m.DispositivoId == dispositivoId)
                .ToListAsync();
        }

        public async Task AddAsync(Meta meta)
        {
            await _context.Metas.AddAsync(meta);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Meta meta)
        {
            _context.Metas.Update(meta);
            await _context.SaveChangesAsync();
        }
    }
}
