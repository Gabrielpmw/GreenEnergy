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
    [Route("api/v1/chamados")]
    [Produces("application/json")]
    [Authorize]
    public class ChamadoController : ControllerBase
    {
        private readonly IChamadoService _chamadoService;

        public ChamadoController(IChamadoService chamadoService)
        {
            _chamadoService = chamadoService;
        }

        /// <summary>
        /// Abre um novo chamado de suporte ou remoção de dispositivo. Apenas Clientes.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Cliente")]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar", "Chamado")]
        public async Task<IActionResult> Create([FromBody] CreateChamadoRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _chamadoService.CreateChamadoAsync(dto, loggedInUserId);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Obtém os detalhes de um chamado pelo ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _chamadoService.GetByIdAsync(id, loggedInUserId, loggedInUserRole);
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
        /// Lista os chamados de suporte. Clientes visualizam apenas seus chamados. Operadores/Admins visualizam todos.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ChamadoResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _chamadoService.ListAllAsync(loggedInUserId, loggedInUserRole);
            return Ok(result);
        }

        /// <summary>
        /// Atualiza o status de um chamado (Ex: Validado, EmAtendimento, Finalizado). Apenas Admin ou Operador.
        /// </summary>
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("AtualizarStatus", "Chamado")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateChamadoStatusRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _chamadoService.UpdateStatusAsync(id, dto, loggedInUserId, loggedInUserRole);
            if (!result.Success)
            {
                if (result.Message?.Contains("não encontrado") == true)
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Provisiona um sensor físico para um chamado de Instalação, vinculando-o ao dispositivo correspondente. Apenas Operadores.
        /// </summary>
        [HttpPost("{id}/provisionar")]
        [Authorize(Roles = "Operador")]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<ChamadoResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("ProvisionarSensor", "Chamado")]
        public async Task<IActionResult> Provisionar(int id, [FromBody] ProvisionarChamadoRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _chamadoService.ProvisionarChamadoAsync(id, dto, loggedInUserId);
            if (!result.Success)
            {
                if (result.Message?.Contains("não encontrado") == true)
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
