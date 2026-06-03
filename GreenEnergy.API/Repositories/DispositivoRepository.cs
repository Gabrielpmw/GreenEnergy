using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class DispositivoRepository : IDispositivoRepository
    {
        private readonly ApplicationDbContext _context;

        public DispositivoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Dispositivo?> GetByIdAsync(int id)
        {
            return await _context.Dispositivos
                .Include(d => d.Categoria)
                .Include(d => d.Sensor)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<IEnumerable<Dispositivo>> ListAllAsync()
        {
            return await _context.Dispositivos
                .Include(d => d.Categoria)
                .Include(d => d.Sensor)
                .ToListAsync();
        }

        public async Task<IEnumerable<Dispositivo>> ListByUnidadeConsumidoraIdAsync(int unidadeId)
        {
            return await _context.Dispositivos
                .Include(d => d.Categoria)
                .Include(d => d.Sensor)
                .Where(d => d.UnidadeConsumidoraId == unidadeId)
                .ToListAsync();
        }

        public async Task AddAsync(Dispositivo dispositivo)
        {
            await _context.Dispositivos.AddAsync(dispositivo);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Dispositivo dispositivo)
        {
            _context.Dispositivos.Update(dispositivo);
            await _context.SaveChangesAsync();
        }
    }
}
