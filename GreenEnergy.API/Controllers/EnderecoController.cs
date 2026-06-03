using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Services;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/enderecos")]
    [Produces("application/json")]
    [Authorize]
    public class EnderecoController : ControllerBase
    {
        private readonly IEnderecoService _enderecoService;

        public EnderecoController(IEnderecoService enderecoService)
        {
            _enderecoService = enderecoService;
        }

        /// <summary>
        /// Consulta CEP utilizando proxy ViaCEP de forma síncrona.
        /// </summary>
        [HttpGet("cep/{cep}")]
        [ProducesResponseType(typeof(ApiResponse<ViaCepDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ViaCepDTO>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ConsultarCep(string cep)
        {
            var result = await _enderecoService.ConsultarCepAsync(cep);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Consulta informações demográficas de município cached pelo código do IBGE.
        /// </summary>
        [HttpGet("ibge/{codigoIBGE}")]
        [ProducesResponseType(typeof(ApiResponse<IbgeMunicipioResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IbgeMunicipioResponseDTO>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ConsultarIbgeCache(string codigoIBGE)
        {
            var result = await _enderecoService.ConsultarIbgeCacheAsync(codigoIBGE);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Obtém o comparativo de eficiência de energia elétrica por CEP.
        /// </summary>
        [HttpGet("comparativo/cep/{cep}")]
        [Authorize(Roles = "Cliente")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ComparativoEficienciaDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ComparativoEficienciaDTO>>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ObterComparativoPorCep(string cep)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int clienteId))
            {
                return Unauthorized();
            }

            var result = await _enderecoService.ObterComparativoPorCepAsync(cep, clienteId);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Obtém o comparativo de eficiência de energia elétrica por Cidade.
        /// </summary>
        [HttpGet("comparativo/cidade/{cidade}")]
        [Authorize(Roles = "Cliente")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ComparativoEficienciaDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ComparativoEficienciaDTO>>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ObterComparativoPorCidade(string cidade)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int clienteId))
            {
                return Unauthorized();
            }

            var result = await _enderecoService.ObterComparativoPorCidadeAsync(cidade, clienteId);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
