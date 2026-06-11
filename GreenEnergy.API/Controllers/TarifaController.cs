using System.Collections.Generic;
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
    [Route("api/v1/tarifas")]
    [Produces("application/json")]
    [Authorize]
    public class TarifaController : ControllerBase
    {
        private readonly ITarifaService _tarifaService;

        public TarifaController(ITarifaService tarifaService)
        {
            _tarifaService = tarifaService;
        }

        /// <summary>
        /// Lista todo o histórico de tarifas cadastradas. Disponível para todos os usuários autenticados.
        /// </summary>
        /// <returns>Histórico de tarifas.</returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<TarifaResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _tarifaService.ListAllAsync();
            return Ok(result);
        }

        /// <summary>
        /// Obtém a tarifa atualmente ativa (mais recente por início de vigência).
        /// </summary>
        /// <returns>Dados da tarifa ativa.</returns>
        [HttpGet("ativa")]
        [ProducesResponseType(typeof(ApiResponse<TarifaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<TarifaResponseDTO>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetLatestActive()
        {
            var result = await _tarifaService.GetLatestActiveAsync();
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Cadastra uma nova bandeira/tarifa energética. Disponível apenas para Administradores.
        /// </summary>
        /// <param name="dto">Dados da tarifa a criar.</param>
        /// <returns>Dados da tarifa criada.</returns>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<TarifaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<TarifaResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Criar Tarifa", "Tarifa")]
        public async Task<IActionResult> Create([FromBody] CreateTarifaRequestDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<TarifaResponseDTO>("Dados inválidos."));
            }

            var result = await _tarifaService.CreateTarifaAsync(dto);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Altera o estado de ativação de uma tarifa (ativa/desativa). Apenas Administradores.
        /// </summary>
        /// <param name="id">ID da tarifa.</param>
        /// <param name="active">Status de ativação desejado.</param>
        /// <returns>Dados da tarifa modificada.</returns>
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<TarifaResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<TarifaResponseDTO>), StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(AuditLogFilter))]
        [AuditLog("Alterar Status Tarifa", "Tarifa")]
        public async Task<IActionResult> ToggleState(int id, [FromQuery] bool active)
        {
            var result = await _tarifaService.ToggleTarifaStateAsync(id, active);
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
