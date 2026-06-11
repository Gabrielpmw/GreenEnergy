using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface ICategoriaAparelhoRepository
    {
        Task<CategoriaAparelho?> GetByIdAsync(int id);
        Task<IEnumerable<CategoriaAparelho>> ListAllAsync();
        Task AddAsync(CategoriaAparelho categoria);
        Task UpdateAsync(CategoriaAparelho categoria);
    }
}
