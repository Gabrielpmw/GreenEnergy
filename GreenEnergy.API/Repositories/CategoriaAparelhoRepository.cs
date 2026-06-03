using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class CategoriaAparelhoRepository : ICategoriaAparelhoRepository
    {
        private readonly ApplicationDbContext _context;

        public CategoriaAparelhoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CategoriaAparelho?> GetByIdAsync(int id)
        {
            return await _context.CategoriasAparelhos
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<IEnumerable<CategoriaAparelho>> ListAllAsync()
        {
            return await _context.CategoriasAparelhos
                .ToListAsync();
        }

        public async Task AddAsync(CategoriaAparelho categoria)
        {
            await _context.CategoriasAparelhos.AddAsync(categoria);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(CategoriaAparelho categoria)
        {
            _context.CategoriasAparelhos.Update(categoria);
            await _context.SaveChangesAsync();
        }
    }
}
