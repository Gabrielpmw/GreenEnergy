using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface ICategoriaAparelhoService
    {
        Task<ApiResponse<CategoriaAparelhoResponseDTO>> CreateCategoriaAsync(CreateCategoriaAparelhoRequestDTO dto);
        Task<ApiResponse<CategoriaAparelhoResponseDTO>> GetByIdAsync(int id);
        Task<ApiResponse<IEnumerable<CategoriaAparelhoResponseDTO>>> ListAllAsync();
        Task<ApiResponse<CategoriaAparelhoResponseDTO>> UpdateAsync(int id, CreateCategoriaAparelhoRequestDTO dto);
        Task<ApiResponse<bool>> DesativarAsync(int id);
    }
}
