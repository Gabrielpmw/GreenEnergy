using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IConfiguracaoAPIRepository
    {
        Task<ConfiguracaoAPI?> GetByIdAsync(int id);
        Task<ConfiguracaoAPI?> GetByNameAsync(string apiName);
        Task<IEnumerable<ConfiguracaoAPI>> ListAllAsync();
        Task AddAsync(ConfiguracaoAPI config);
        Task UpdateAsync(ConfiguracaoAPI config);
        Task DeleteAsync(ConfiguracaoAPI config);
    }
}
