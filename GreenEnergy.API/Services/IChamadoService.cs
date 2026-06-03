using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IChamadoService
    {
        Task<ApiResponse<ChamadoResponseDTO>> CreateChamadoAsync(CreateChamadoRequestDTO dto, int requestUserId);
        Task<ApiResponse<ChamadoResponseDTO>> GetByIdAsync(int id, int requestUserId, string requestUserRole);
        Task<ApiResponse<IEnumerable<ChamadoResponseDTO>>> ListAllAsync(int requestUserId, string requestUserRole);
        Task<ApiResponse<ChamadoResponseDTO>> UpdateStatusAsync(int id, UpdateChamadoStatusRequestDTO dto, int requestUserId, string requestUserRole);
    }
}
