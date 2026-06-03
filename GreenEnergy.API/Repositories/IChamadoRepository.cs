using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IChamadoRepository
    {
        Task<Chamado?> GetByIdAsync(int id);
        Task<IEnumerable<Chamado>> ListAllAsync();
        Task<IEnumerable<Chamado>> ListByClienteIdAsync(int clienteId);
        Task AddAsync(Chamado chamado);
        Task UpdateAsync(Chamado chamado);
    }
}
