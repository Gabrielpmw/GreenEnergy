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
    [Route("api/v1/metas")]
    [Produces("application/json")]
    [Authorize]
    public class MetaController : ControllerBase
    {
        private readonly IMetaService _metaService;

        public MetaController(IMetaService metaService)
        {
            _metaService = metaService;
        }

        /// <summary>
        /// Propõe uma nova meta de consumo para um dispositivo. Apenas Clientes.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Cliente")]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status403Forbidden)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar", "Meta")]
        public async Task<IActionResult> Propor([FromBody] CreateMetaRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _metaService.ProporMetaAsync(dto, loggedInUserId);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Atualiza uma proposta de meta de consumo existente. Apenas Clientes.
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Cliente")]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Atualizar", "Meta")]
        public async Task<IActionResult> Atualizar(int id, [FromBody] UpdateMetaRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _metaService.AtualizarMetaAsync(id, dto, loggedInUserId);
            if (!result.Success)
            {
                if (result.Message?.Contains("não encontrada") == true)
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Avalia (aprova/devolve) uma proposta de meta. Apenas Operadores e Administradores.
        /// </summary>
        [HttpPatch("{id}/avaliar")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Avaliar", "Meta")]
        public async Task<IActionResult> Avaliar(int id, [FromBody] AvaliarMetaRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _metaService.AvaliarMetaAsync(id, dto, loggedInUserId);
            if (!result.Success)
            {
                if (result.Message?.Contains("não encontrada") == true)
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Obtém uma meta de consumo pelo ID. Clientes visualizam apenas as de seus próprios dispositivos.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _metaService.GetByIdAsync(id, loggedInUserId, loggedInUserRole);
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
        /// Lista todas as metas de consumo. Apenas Administradores e Operadores.
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MetaResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _metaService.ListAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Lista as metas vinculadas a um dispositivo específico.
        /// </summary>
        [HttpGet("dispositivo/{id}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MetaResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MetaResponseDTO>>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MetaResponseDTO>>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetByDispositivo(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _metaService.ListByDispositivoIdAsync(id, loggedInUserId, loggedInUserRole);
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
        /// Finaliza uma meta ativa e reativa o dispositivo caso estivesse suspenso por ela. Apenas Clientes.
        /// </summary>
        [HttpPost("{id}/finalizar")]
        [Authorize(Roles = "Cliente")]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<MetaResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Finalizar", "Meta")]
        public async Task<IActionResult> Finalizar(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _metaService.FinalizarMetaAsync(id, loggedInUserId);
            if (!result.Success)
            {
                if (result.Message?.Contains("não encontrada") == true)
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
