using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IDispositivoRepository
    {
        Task<Dispositivo?> GetByIdAsync(int id);
        Task<IEnumerable<Dispositivo>> ListAllAsync();
        Task<IEnumerable<Dispositivo>> ListByUnidadeConsumidoraIdAsync(int unidadeId);
        Task AddAsync(Dispositivo dispositivo);
        Task UpdateAsync(Dispositivo dispositivo);
    }
}
