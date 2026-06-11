using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IMetaRepository
    {
        Task<Meta?> GetByIdAsync(int id);
        Task<IEnumerable<Meta>> ListAllAsync();
        Task<IEnumerable<Meta>> ListByDispositivoIdAsync(int dispositivoId);
        Task AddAsync(Meta meta);
        Task UpdateAsync(Meta meta);
    }
}
