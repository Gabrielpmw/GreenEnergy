using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IDispositivoService
    {
        Task<ApiResponse<DispositivoResponseDTO>> CreateDispositivoAsync(CreateDispositivoRequestDTO dto, int requestUserId, string requestUserRole);
        Task<ApiResponse<DispositivoResponseDTO>> GetByIdAsync(int id, int requestUserId, string requestUserRole);
        Task<ApiResponse<IEnumerable<DispositivoResponseDTO>>> ListAllAsync(int requestUserId, string requestUserRole);
        Task<ApiResponse<IEnumerable<DispositivoResponseDTO>>> ListByUnidadeConsumidoraIdAsync(int unidadeId, int requestUserId, string requestUserRole);
        Task<ApiResponse<DispositivoResponseDTO>> UpdateAsync(int id, UpdateDispositivoRequestDTO dto, int requestUserId, string requestUserRole);
        Task<ApiResponse<bool>> DesativarAsync(int id);
        Task<ApiResponse<bool>> VincularSensorAsync(int dispositivoId, int sensorId);
        Task<ApiResponse<bool>> DesvincularSensorAsync(int dispositivoId);

        // Anotações
        Task<ApiResponse<AnotacaoDispositivoResponseDTO>> AddAnotacaoAsync(int dispositivoId, CreateAnotacaoDispositivoRequestDTO dto, int requestUserId);
        Task<ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>> ListAnotacoesAsync(int dispositivoId, int requestUserId, string requestUserRole);
        Task<ApiResponse<AnotacaoDispositivoResponseDTO>> UpdateAnotacaoAsync(int anotacaoId, UpdateAnotacaoDispositivoRequestDTO dto, int requestUserId);
        Task<ApiResponse<bool>> DesativarAnotacaoAsync(int anotacaoId, int requestUserId);
    }
}
