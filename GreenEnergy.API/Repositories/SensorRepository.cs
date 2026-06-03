using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class SensorRepository : ISensorRepository
    {
        private readonly ApplicationDbContext _context;

        public SensorRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Sensor?> GetByIdAsync(int id)
        {
            return await _context.Sensores
                .Include(s => s.Dispositivo)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<IEnumerable<Sensor>> ListAllAsync()
        {
            return await _context.Sensores
                .Include(s => s.Dispositivo)
                .ToListAsync();
        }

        public async Task<IEnumerable<Sensor>> ListAvailableAsync()
        {
            return await _context.Sensores
                .Where(s => s.DispositivoId == null && s.Status == SensorStatus.Disponivel)
                .ToListAsync();
        }

        public async Task AddAsync(Sensor sensor)
        {
            await _context.Sensores.AddAsync(sensor);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Sensor sensor)
        {
            _context.Sensores.Update(sensor);
            await _context.SaveChangesAsync();
        }
    }
}
