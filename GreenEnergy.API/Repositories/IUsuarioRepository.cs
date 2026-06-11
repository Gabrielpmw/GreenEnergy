using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public interface IUsuarioRepository
    {
        Task<Usuario?> GetByIdAsync(int id, bool includeDeleted = false);
        Task<Usuario?> GetByEmailAsync(string email);
        Task<IEnumerable<Usuario>> ListAllAsync(UsuarioRole? role = null);
        Task AddAsync(Usuario usuario);
        Task UpdateAsync(Usuario usuario);
        Task<bool> EmailExistsAsync(string email);
    }
}
