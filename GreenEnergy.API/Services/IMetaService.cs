using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IMetaService
    {
        Task<ApiResponse<MetaResponseDTO>> ProporMetaAsync(CreateMetaRequestDTO dto, int clienteId);
        Task<ApiResponse<MetaResponseDTO>> AtualizarMetaAsync(int id, UpdateMetaRequestDTO dto, int clienteId);
        Task<ApiResponse<MetaResponseDTO>> AvaliarMetaAsync(int id, AvaliarMetaRequestDTO dto, int operadorId);
        Task<ApiResponse<MetaResponseDTO>> GetByIdAsync(int id, int userId, string userRole);
        Task<ApiResponse<IEnumerable<MetaResponseDTO>>> ListAllAsync();
        Task<ApiResponse<IEnumerable<MetaResponseDTO>>> ListByDispositivoIdAsync(int dispositivoId, int userId, string userRole);
        Task<ApiResponse<MetaResponseDTO>> FinalizarMetaAsync(int id, int clienteId);
        Task<ApiResponse<MetaResponseDTO>> DesativarMetaOperadorAsync(int id, int operadorId);
    }
}
