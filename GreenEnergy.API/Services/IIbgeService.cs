using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IIbgeService
    {
        Task<ApiResponse<IbgeMunicipioResponseDTO>> ObterMunicipioPorCodigoAsync(string codigo);
    }
}
