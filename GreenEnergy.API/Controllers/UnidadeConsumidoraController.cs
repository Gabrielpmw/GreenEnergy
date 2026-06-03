using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GreenEnergy.API.Middleware;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Services;
using GreenEnergy.API.Integrations;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/unidades")]
    [Produces("application/json")]
    [Authorize]
    public class UnidadeConsumidoraController : ControllerBase
    {
        private readonly IUnidadeConsumidoraService _unidadeService;
        private readonly IViaCepClient _viaCepClient;

        public UnidadeConsumidoraController(IUnidadeConsumidoraService unidadeService, IViaCepClient viaCepClient)
        {
            _unidadeService = unidadeService;
            _viaCepClient = viaCepClient;
        }

        /// <summary>
        /// Cadastra uma nova Unidade Consumidora.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<UnidadeConsumidoraResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<UnidadeConsumidoraResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar", "UnidadeConsumidora")]
        public async Task<IActionResult> Create([FromBody] CreateUnidadeConsumidoraRequestDTO dto, [FromQuery] int? usuarioId = null)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            int targetUserId = loggedInUserId;

            // Se for Admin ou Operador, permite cadastrar para outro usuário passando usuarioId
            if (loggedInUserRole == "Admin" || loggedInUserRole == "Operador")
            {
                if (usuarioId.HasValue)
                {
                    targetUserId = usuarioId.Value;
                }
            }

            var result = await _unidadeService.CreateUnidadeConsumidoraAsync(dto, targetUserId);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Obtém os detalhes de uma Unidade Consumidora pelo ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<UnidadeConsumidoraResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<UnidadeConsumidoraResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<UnidadeConsumidoraResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _unidadeService.GetByIdAsync(id, loggedInUserId, loggedInUserRole);
            if (!result.Success)
            {
                if (result.Message?.Contains("Acesso negado") == true)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, result);
                }
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Lista as Unidades Consumidoras acessíveis pelo usuário logado.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _unidadeService.ListAllAsync(loggedInUserId, loggedInUserRole);
            return Ok(result);
        }

        /// <summary>
        /// Lista as Unidades Consumidoras pertencentes a um cliente específico (Apenas Admin/Operador ou o próprio Cliente).
        /// </summary>
        [HttpGet("cliente/{clienteId}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<UnidadeConsumidoraResponseDTO>>), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetByClienteId(int clienteId)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _unidadeService.ListByClienteIdAsync(clienteId, loggedInUserId, loggedInUserRole);
            if (!result.Success)
            {
                return StatusCode(StatusCodes.Status403Forbidden, result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Atualiza os dados de uma Unidade Consumidora.
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<UnidadeConsumidoraResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<UnidadeConsumidoraResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<UnidadeConsumidoraResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Atualizar", "UnidadeConsumidora")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateUnidadeConsumidoraRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _unidadeService.UpdateAsync(id, dto, loggedInUserId, loggedInUserRole);
            if (!result.Success)
            {
                if (result.Message?.Contains("Acesso negado") == true)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, result);
                }
                if (result.Message?.Contains("não encontrada") == true)
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Desativa (soft-delete) uma Unidade Consumidora. Apenas Administradores ou Operadores têm acesso.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Desativar", "UnidadeConsumidora")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _unidadeService.DesativarAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Proxy endpoint para consultar CEP usando a API do ViaCEP de forma síncrona.
        /// </summary>
        [HttpGet("cep/{cep}")]
        [ProducesResponseType(typeof(ApiResponse<ViaCepDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ViaCepDTO>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ConsultarCep(string cep)
        {
            try
            {
                var result = await _viaCepClient.ConsultarCepAsync(cep);
                if (result == null)
                {
                    return BadRequest(new ApiResponse<ViaCepDTO>("O CEP informado é inválido ou não foi localizado."));
                }
                return Ok(new ApiResponse<ViaCepDTO>(result, "CEP consultado com sucesso."));
            }
            catch (System.Exception)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new ApiResponse<ViaCepDTO>("A API ViaCEP está indisponível no momento. Preencha o endereço manualmente."));
            }
        }
    }
}
