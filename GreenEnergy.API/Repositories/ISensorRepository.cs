using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface ISensorRepository
    {
        Task<Sensor?> GetByIdAsync(int id);
        Task<IEnumerable<Sensor>> ListAllAsync();
        Task<IEnumerable<Sensor>> ListAvailableAsync();
        Task AddAsync(Sensor sensor);
        Task UpdateAsync(Sensor sensor);
    }
}
