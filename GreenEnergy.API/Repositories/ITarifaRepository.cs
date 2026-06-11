using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface ITarifaRepository
    {
        Task<Tarifa?> GetByIdAsync(int id);
        Task<IEnumerable<Tarifa>> ListAllAsync();
        Task<Tarifa?> GetLatestActiveAsync();
        Task AddAsync(Tarifa tarifa);
        Task UpdateAsync(Tarifa tarifa);
    }
}
