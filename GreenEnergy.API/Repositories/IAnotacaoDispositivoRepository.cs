using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IAnotacaoDispositivoRepository
    {
        Task<AnotacaoDispositivo?> GetByIdAsync(int id);
        Task<IEnumerable<AnotacaoDispositivo>> ListByDispositivoIdAsync(int dispositivoId);
        Task AddAsync(AnotacaoDispositivo anotacao);
        Task UpdateAsync(AnotacaoDispositivo anotacao);
    }
}
