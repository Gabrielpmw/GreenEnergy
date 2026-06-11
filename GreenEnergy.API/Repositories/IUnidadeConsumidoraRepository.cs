using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IUnidadeConsumidoraRepository
    {
        Task<UnidadeConsumidora?> GetByIdAsync(int id);
        Task<IEnumerable<UnidadeConsumidora>> ListAllAsync();
        Task<IEnumerable<UnidadeConsumidora>> ListByUsuarioIdAsync(int usuarioId);
        Task AddAsync(UnidadeConsumidora unidade);
        Task UpdateAsync(UnidadeConsumidora unidade);
    }
}
