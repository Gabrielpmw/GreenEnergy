using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IAuthService
    {
        Task<ApiResponse<LoginResponseDTO>> LoginAsync(LoginRequestDTO dto);
        Task<ApiResponse<UsuarioResponseDTO>> RegisterClientAsync(RegisterRequestDTO dto);
        Task<ApiResponse<LoginResponseDTO>> RefreshTokenAsync(RefreshTokenRequestDTO dto);
        Task<ApiResponse<bool>> LogoutAsync(int userId);
    }
}
