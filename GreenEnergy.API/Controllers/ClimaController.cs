using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Services;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/clima")]
    [Produces("application/json")]
    [Authorize]
    public class ClimaController : ControllerBase
    {
        private readonly IClimaService _climaService;

        public ClimaController(IClimaService climaService)
        {
            _climaService = climaService;
        }

        /// <summary>
        /// Obtém dados climáticos em cache para o código IBGE informado.
        /// </summary>
        [HttpGet("{codigoIBGE}")]
        [ProducesResponseType(typeof(ApiResponse<ClimaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ClimaResponseDTO>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ObterClimaPorCodigoIBGE(string codigoIBGE)
        {
            var result = await _climaService.ObterClimaPorCodigoIBGEAsync(codigoIBGE);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
