using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class UnidadeConsumidoraRepository : IUnidadeConsumidoraRepository
    {
        private readonly ApplicationDbContext _context;

        public UnidadeConsumidoraRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UnidadeConsumidora?> GetByIdAsync(int id)
        {
            return await _context.UnidadesConsumidoras
                .Include(u => u.Endereco)
                .Include(u => u.Dispositivos)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<IEnumerable<UnidadeConsumidora>> ListAllAsync()
        {
            return await _context.UnidadesConsumidoras
                .Include(u => u.Endereco)
                .ToListAsync();
        }

        public async Task<IEnumerable<UnidadeConsumidora>> ListByUsuarioIdAsync(int usuarioId)
        {
            return await _context.UnidadesConsumidoras
                .Include(u => u.Endereco)
                .Where(u => u.UsuarioId == usuarioId)
                .ToListAsync();
        }

        public async Task AddAsync(UnidadeConsumidora unidade)
        {
            await _context.UnidadesConsumidoras.AddAsync(unidade);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UnidadeConsumidora unidade)
        {
            _context.UnidadesConsumidoras.Update(unidade);
            await _context.SaveChangesAsync();
        }
    }
}
