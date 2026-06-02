using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Models.Entities;

namespace GreenEnergy.API.Services
{
    public interface IUsuarioService
    {
        Task<ApiResponse<IEnumerable<UsuarioResponseDTO>>> ListUsersAsync(UsuarioRole? role = null);
        Task<ApiResponse<UsuarioDetalhadoResponseDTO>> GetUserByIdAsync(int id, int requestUserId, string requestUserRole);
        Task<ApiResponse<UsuarioResponseDTO>> CreateOperatorAsync(CreateOperadorRequestDTO dto);
        Task<ApiResponse<UsuarioResponseDTO>> UpdateOwnProfileAsync(int id, UpdateUsuarioRequestDTO userDto, UpdatePerfilRequestDTO profileDto);
        Task<ApiResponse<UsuarioResponseDTO>> UpdateOperatorAsync(int id, CreateOperadorRequestDTO dto);
        Task<ApiResponse<bool>> ToggleUserActiveStateAsync(int id, bool active);
    }
}
