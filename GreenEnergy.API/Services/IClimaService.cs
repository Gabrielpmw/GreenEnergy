using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IClimaService
    {
        Task<ApiResponse<ClimaResponseDTO>> ObterClimaPorCodigoIBGEAsync(string codigoIBGE);
    }
}
