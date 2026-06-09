using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GreenEnergy.API.Middleware;
using GreenEnergy.API.Models.DTOs;
using GreenEnergy.API.Services;

namespace GreenEnergy.API.Controllers
{
    [ApiController]
    [Route("api/v1/relatorios")]
    [Produces("application/json")]
    [Authorize(Roles = "Admin,Operador,Cliente")]
    public class RelatorioTecnicoController : ControllerBase
    {
        private readonly IRelatorioTecnicoService _relatorioService;

        public RelatorioTecnicoController(IRelatorioTecnicoService relatorioService)
        {
            _relatorioService = relatorioService;
        }

        /// <summary>
        /// Cria um novo relatório técnico associado a um chamado. Apenas Operadores.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Operador")]
        [ProducesResponseType(typeof(ApiResponse<RelatorioTecnicoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<RelatorioTecnicoResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar", "RelatorioTecnico")]
        public async Task<IActionResult> Create([FromBody] CreateRelatorioTecnicoRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _relatorioService.CreateRelatorioAsync(dto, loggedInUserId);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Obtém os detalhes de um relatório técnico pelo ID. Apenas Administradores e Operadores.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<RelatorioTecnicoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<RelatorioTecnicoResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<RelatorioTecnicoResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _relatorioService.GetByIdAsync(id, loggedInUserId, loggedInUserRole);
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
        /// Lista todos os relatórios técnicos. Apenas Administradores e Operadores.
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _relatorioService.ListAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Lista todos os relatórios técnicos associados a um chamado específico.
        /// </summary>
        [HttpGet("chamado/{id}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetByChamado(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _relatorioService.ListByChamadoIdAsync(id, loggedInUserId, loggedInUserRole);
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
        /// Lista todos os relatórios técnicos associados a um dispositivo específico.
        /// </summary>
        [HttpGet("dispositivo/{id}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RelatorioTecnicoResponseDTO>>), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetByDispositivo(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _relatorioService.ListByDispositivoIdAsync(id, loggedInUserId, loggedInUserRole);
            if (!result.Success)
            {
                if (result.Message?.Contains("Acesso negado") == true)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, result);
                }
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
