using System.Collections.Generic;
using System.Threading.Tasks;
using GreenEnergy.API.Models.DTOs;

namespace GreenEnergy.API.Services
{
    public interface IEnderecoService
    {
        Task<ApiResponse<ViaCepDTO>> ConsultarCepAsync(string cep);
        Task<ApiResponse<IbgeMunicipioResponseDTO>> ConsultarIbgeCacheAsync(string codigoIBGE);
        Task<ApiResponse<IEnumerable<ComparativoEficienciaDTO>>> ObterComparativoPorCepAsync(string cep, int clienteId);
        Task<ApiResponse<IEnumerable<ComparativoEficienciaDTO>>> ObterComparativoPorCidadeAsync(string cidade, int clienteId);
    }
}
