using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class ChamadoRepository : IChamadoRepository
    {
        private readonly ApplicationDbContext _context;

        public ChamadoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Chamado?> GetByIdAsync(int id)
        {
            return await _context.Chamados
                .Include(c => c.Cliente)
                .Include(c => c.Operador)
                .Include(c => c.Dispositivo)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<Chamado>> ListAllAsync()
        {
            return await _context.Chamados
                .Include(c => c.Cliente)
                .Include(c => c.Operador)
                .Include(c => c.Dispositivo)
                .ToListAsync();
        }

        public async Task<IEnumerable<Chamado>> ListByClienteIdAsync(int clienteId)
        {
            return await _context.Chamados
                .Include(c => c.Cliente)
                .Include(c => c.Operador)
                .Include(c => c.Dispositivo)
                .Where(c => c.ClienteId == clienteId)
                .ToListAsync();
        }

        public async Task AddAsync(Chamado chamado)
        {
            await _context.Chamados.AddAsync(chamado);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Chamado chamado)
        {
            _context.Chamados.Update(chamado);
            await _context.SaveChangesAsync();
        }
    }
}
