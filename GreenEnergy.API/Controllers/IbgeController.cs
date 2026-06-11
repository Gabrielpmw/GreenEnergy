using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Services;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/ibge")]
    [Produces("application/json")]
    [Authorize]
    public class IbgeController : ControllerBase
    {
        private readonly IIbgeService _ibgeService;

        public IbgeController(IIbgeService ibgeService)
        {
            _ibgeService = ibgeService;
        }

        /// <summary>
        /// Obtém informações do município do IBGE em cache.
        /// </summary>
        [HttpGet("municipio/{codigo}")]
        [ProducesResponseType(typeof(ApiResponse<IbgeMunicipioResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IbgeMunicipioResponseDTO>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ObterMunicipioPorCodigo(string codigo)
        {
            var result = await _ibgeService.ObterMunicipioPorCodigoAsync(codigo);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
