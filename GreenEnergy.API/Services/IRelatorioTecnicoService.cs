using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IRelatorioTecnicoService
    {
        Task<ApiResponse<RelatorioTecnicoResponseDTO>> CreateRelatorioAsync(CreateRelatorioTecnicoRequestDTO dto, int operadorId);
        Task<ApiResponse<RelatorioTecnicoResponseDTO>> GetByIdAsync(int id);
        Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListAllAsync();
        Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListByChamadoIdAsync(int chamadoId);
        Task<ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>> ListByDispositivoIdAsync(int dispositivoId);
    }
}
