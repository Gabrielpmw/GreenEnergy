using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IUnidadeConsumidoraService
    {
        Task<ApiResponse<UnidadeConsumidoraResponseDTO>> CreateUnidadeConsumidoraAsync(CreateUnidadeConsumidoraRequestDTO dto, int usuarioId);
        Task<ApiResponse<UnidadeConsumidoraResponseDTO>> GetByIdAsync(int id, int requestUserId, string requestUserRole);
        Task<ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>> ListAllAsync(int requestUserId, string requestUserRole);
        Task<ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>> ListByClienteIdAsync(int clienteId, int requestUserId, string requestUserRole);
        Task<ApiResponse<UnidadeConsumidoraResponseDTO>> UpdateAsync(int id, CreateUnidadeConsumidoraRequestDTO dto, int requestUserId, string requestUserRole);
        Task<ApiResponse<bool>> DesativarAsync(int id);
    }
}
