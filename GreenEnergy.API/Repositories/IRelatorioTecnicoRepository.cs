using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IRelatorioTecnicoRepository
    {
        Task<RelatorioTecnico?> GetByIdAsync(int id);
        Task<IEnumerable<RelatorioTecnico>> ListAllAsync();
        Task<IEnumerable<RelatorioTecnico>> ListByChamadoIdAsync(int chamadoId);
        Task AddAsync(RelatorioTecnico relatorio);
    }
}
