using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class ConfiguracaoAPIRepository : IConfiguracaoAPIRepository
    {
        private readonly ApplicationDbContext _context;

        public ConfiguracaoAPIRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ConfiguracaoAPI?> GetByIdAsync(int id)
        {
            return await _context.ConfiguracoesAPI.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        }

        public async Task<ConfiguracaoAPI?> GetByNameAsync(string apiName)
        {
            return await _context.ConfiguracoesAPI.FirstOrDefaultAsync(c => c.NomeAPI == apiName && !c.IsDeleted);
        }

        public async Task<IEnumerable<ConfiguracaoAPI>> ListAllAsync()
        {
            return await _context.ConfiguracoesAPI
                .Where(c => !c.IsDeleted)
                .ToListAsync();
        }

        public async Task AddAsync(ConfiguracaoAPI config)
        {
            await _context.ConfiguracoesAPI.AddAsync(config);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ConfiguracaoAPI config)
        {
            _context.ConfiguracoesAPI.Update(config);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ConfiguracaoAPI config)
        {
            config.IsDeleted = true;
            config.IsActive = false;
            _context.ConfiguracoesAPI.Update(config);
            await _context.SaveChangesAsync();
        }
    }
}
