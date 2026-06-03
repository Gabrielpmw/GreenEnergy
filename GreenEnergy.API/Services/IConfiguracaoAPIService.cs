using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IConfiguracaoAPIService
    {
        Task<ApiResponse<ConfiguracaoAPIResponseDTO>> GetByIdAsync(int id);
        Task<ApiResponse<ConfiguracaoAPIResponseDTO>> GetByNameAsync(string apiName);
        Task<ApiResponse<IEnumerable<ConfiguracaoAPIResponseDTO>>> ListAllAsync();
        Task<ApiResponse<ConfiguracaoAPIResponseDTO>> CreateConfigAsync(CreateConfiguracaoAPIRequestDTO dto);
        Task<ApiResponse<ConfiguracaoAPIResponseDTO>> UpdateConfigAsync(int id, UpdateConfiguracaoAPIRequestDTO dto);
        Task<ApiResponse<bool>> DeleteConfigAsync(int id);
    }
}
