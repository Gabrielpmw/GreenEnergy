using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface ITarifaService
    {
        Task<ApiResponse<TarifaResponseDTO>> GetByIdAsync(int id);
        Task<ApiResponse<IEnumerable<TarifaResponseDTO>>> ListAllAsync();
        Task<ApiResponse<TarifaResponseDTO>> GetLatestActiveAsync();
        Task<ApiResponse<TarifaResponseDTO>> CreateTarifaAsync(CreateTarifaRequestDTO dto);
        Task<ApiResponse<TarifaResponseDTO>> ToggleTarifaStateAsync(int id, bool active);
    }
}
