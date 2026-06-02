using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly ApplicationDbContext _context;

        public UsuarioRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Usuario?> GetByIdAsync(int id, bool includeDeleted = false)
        {
            var query = _context.Usuarios.AsQueryable();
            if (includeDeleted)
            {
                query = query.IgnoreQueryFilters();
            }
            return await query
                .Include(u => u.Perfil)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<Usuario?> GetByEmailAsync(string email)
        {
            return await _context.Usuarios
                .Include(u => u.Perfil)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<IEnumerable<Usuario>> ListAllAsync(UsuarioRole? role = null)
        {
            var query = _context.Usuarios
                .Include(u => u.Perfil)
                .AsQueryable();

            if (role.HasValue)
            {
                query = query.Where(u => u.Role == role.Value);
            }

            return await query.ToListAsync();
        }

        public async Task AddAsync(Usuario usuario)
        {
            await _context.Usuarios.AddAsync(usuario);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Usuario usuario)
        {
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            // Verificação de e-mail duplicado deve ignorar filtros para evitar registrar um e-mail idêntico ao de uma conta excluída/desativada
            return await _context.Usuarios
                .IgnoreQueryFilters()
                .AnyAsync(u => u.Email == email);
        }
    }
}
