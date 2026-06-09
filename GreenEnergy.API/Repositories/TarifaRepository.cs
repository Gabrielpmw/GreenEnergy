using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GreenEnergy.API.Data;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Repositories
{
    public class TarifaRepository : ITarifaRepository
    {
        private readonly ApplicationDbContext _context;

        public TarifaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Tarifa?> GetByIdAsync(int id)
        {
            return await _context.Tarifas.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
        }

        public async Task<IEnumerable<Tarifa>> ListAllAsync()
        {
            return await _context.Tarifas
                .Where(t => !t.IsDeleted)
                .OrderByDescending(t => t.VigenciaInicio)
                .ToListAsync();
        }

        public async Task<Tarifa?> GetLatestActiveAsync()
        {
            return await _context.Tarifas
                .Where(t => t.IsActive && !t.IsDeleted)
                .OrderByDescending(t => t.VigenciaInicio)
                .FirstOrDefaultAsync();
        }

        public async Task AddAsync(Tarifa tarifa)
        {
            await _context.Tarifas.AddAsync(tarifa);

            // Notificar todos os clientes sobre a nova tarifa
            var clientes = await _context.Usuarios
                .Where(u => u.Role == UsuarioRole.Cliente && u.IsActive && !u.IsDeleted)
                .ToListAsync();

            foreach (var cliente in clientes)
            {
                var alerta = new Alerta
                {
                    UsuarioId = cliente.Id,
                    DispositivoId = null,
                    Mensagem = $"Aviso de Tarifa: A bandeira tarifária foi alterada para {tarifa.Bandeira} com o valor de R$ {tarifa.ValorKWh:F4} por kWh.",
                    Tipo = TipoAlerta.Informativo,
                    Lido = false,
                    GeradoEm = DateTime.UtcNow
                };
                await _context.Alertas.AddAsync(alerta);
            }

            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Tarifa tarifa)
        {
            _context.Tarifas.Update(tarifa);
            await _context.SaveChangesAsync();
        }
    }
}
