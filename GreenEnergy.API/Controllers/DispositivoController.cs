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
    [Route("api/v1/dispositivos")]
    [Produces("application/json")]
    [Authorize]
    public class DispositivoController : ControllerBase
    {
        private readonly IDispositivoService _dispositivoService;

        public DispositivoController(IDispositivoService dispositivoService)
        {
            _dispositivoService = dispositivoService;
        }

        /// <summary>
        /// Cadastra um novo dispositivo em uma Unidade Consumidora.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status403Forbidden)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar", "Dispositivo")]
        public async Task<IActionResult> Create([FromBody] CreateDispositivoRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.CreateDispositivoAsync(dto, loggedInUserId, loggedInUserRole);
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

        /// <summary>
        /// Obtém os detalhes de um dispositivo pelo ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.GetByIdAsync(id, loggedInUserId, loggedInUserRole);
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
        /// Lista os dispositivos acessíveis pelo usuário logado.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DispositivoResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.ListAllAsync(loggedInUserId, loggedInUserRole);
            return Ok(result);
        }

        /// <summary>
        /// Lista todos os dispositivos de uma Unidade Consumidora específica.
        /// </summary>
        [HttpGet("unidade/{unidadeId}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DispositivoResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DispositivoResponseDTO>>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DispositivoResponseDTO>>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetByUnidadeId(int unidadeId)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.ListByUnidadeConsumidoraIdAsync(unidadeId, loggedInUserId, loggedInUserRole);
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
        /// Atualiza os dados cadastrais de um dispositivo.
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<DispositivoResponseDTO>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Atualizar", "Dispositivo")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDispositivoRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.UpdateAsync(id, dto, loggedInUserId, loggedInUserRole);
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
        /// Desativa (soft-delete) um dispositivo e libera seu sensor para o estoque.
        /// Apenas Administradores ou Operadores podem executar.
        /// </summary>
        [HttpPatch("{id}/desativar")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Desativar", "Dispositivo")]
        public async Task<IActionResult> Desativar(int id)
        {
            var result = await _dispositivoService.DesativarAsync(id);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Vincula um sensor físico de estoque a um dispositivo.
        /// Apenas Administradores ou Operadores podem executar.
        /// </summary>
        [HttpPost("{id}/vincular-sensor/{sensorId}")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("VincularSensor", "Dispositivo")]
        public async Task<IActionResult> VincularSensor(int id, int sensorId)
        {
            var result = await _dispositivoService.VincularSensorAsync(id, sensorId);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Desvincula o sensor físico associado a um dispositivo, retornando-o ao estoque.
        /// Apenas Administradores ou Operadores podem executar.
        /// </summary>
        [HttpPost("{id}/desvincular-sensor")]
        [Authorize(Roles = "Admin,Operador")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("DesvincularSensor", "Dispositivo")]
        public async Task<IActionResult> DesvincularSensor(int id)
        {
            var result = await _dispositivoService.DesvincularSensorAsync(id);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // --- ANOTAÇÕES ---

        /// <summary>
        /// Adiciona uma anotação técnica/comercial a um dispositivo.
        /// </summary>
        [HttpPost("{id}/anotacoes")]
        [ProducesResponseType(typeof(ApiResponse<AnotacaoDispositivoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AnotacaoDispositivoResponseDTO>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<AnotacaoDispositivoResponseDTO>), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> AddAnotacao(int id, [FromBody] CreateAnotacaoDispositivoRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.AddAnotacaoAsync(id, dto, loggedInUserId);
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

        /// <summary>
        /// Lista todas as anotações registradas para um dispositivo.
        /// </summary>
        [HttpGet("{id}/anotacoes")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<AnotacaoDispositivoResponseDTO>>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAnotacoes(int id)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var loggedInUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId) || string.IsNullOrEmpty(loggedInUserRole))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.ListAnotacoesAsync(id, loggedInUserId, loggedInUserRole);
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
        /// Atualiza o conteúdo de uma anotação pertencente ao usuário logado.
        /// </summary>
        [HttpPut("anotacoes/{anotacaoId}")]
        [ProducesResponseType(typeof(ApiResponse<AnotacaoDispositivoResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<AnotacaoDispositivoResponseDTO>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<AnotacaoDispositivoResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateAnotacao(int anotacaoId, [FromBody] UpdateAnotacaoDispositivoRequestDTO dto)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.UpdateAnotacaoAsync(anotacaoId, dto, loggedInUserId);
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
        /// Exclui (soft-delete) uma anotação pertencente ao usuário logado.
        /// </summary>
        [HttpDelete("anotacoes/{anotacaoId}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteAnotacao(int anotacaoId)
        {
            var loggedInUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(loggedInUserIdClaim) || !int.TryParse(loggedInUserIdClaim, out int loggedInUserId))
            {
                return Unauthorized();
            }

            var result = await _dispositivoService.DesativarAnotacaoAsync(anotacaoId, loggedInUserId);
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
    }
}
