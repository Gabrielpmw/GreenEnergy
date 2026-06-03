using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Services
{
    public interface ISensorService
    {
        Task<ApiResponse<SensorResponseDTO>> CreateSensorAsync(CreateSensorRequestDTO dto);
        Task<ApiResponse<SensorResponseDTO>> GetByIdAsync(int id);
        Task<ApiResponse<IEnumerable<SensorResponseDTO>>> ListAllAsync();
        Task<ApiResponse<IEnumerable<SensorResponseDTO>>> ListAvailableAsync();
        Task<ApiResponse<SensorResponseDTO>> UpdateAsync(int id, UpdateSensorRequestDTO dto);
        Task<ApiResponse<SensorResponseDTO>> UpdateStatusAsync(int id, SensorStatus status);
        Task<ApiResponse<bool>> DesativarAsync(int id);
    }
}
